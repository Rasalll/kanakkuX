-- Ledgerflow initial schema
-- All application data belongs to the authenticated user and is protected by RLS.

create extension if not exists pgcrypto;

create type public.payment_method as enum ('UPI', 'Cash', 'Bank Transfer', 'Card', 'Other');
create type public.lending_status as enum ('pending', 'partially_paid', 'paid', 'overdue');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  icon text,
  color text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 100),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  category_id uuid not null references public.categories(id) on delete restrict,
  source_id uuid references public.sources(id) on delete set null,
  payment_method public.payment_method not null,
  date date not null default current_date,
  note text,
  receipt_url text,
  receipt_public_id text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  source_id uuid references public.sources(id) on delete set null,
  payment_method public.payment_method not null,
  date date not null default current_date,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.lending (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null check (char_length(trim(person_name)) between 1 and 120),
  phone_number text,
  original_amount numeric(14, 2) not null check (original_amount > 0),
  lent_via public.payment_method not null check (lent_via <> 'Card'),
  lent_date date not null default current_date,
  duration_days integer check (duration_days is null or duration_days >= 0),
  due_date date,
  note text,
  status public.lending_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (due_date is null or due_date >= lent_date)
);

create table public.repayments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lending_id uuid not null references public.lending(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  received_via public.payment_method not null,
  date date not null default current_date,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index categories_user_id_idx on public.categories(user_id);
create index sources_user_id_archived_idx on public.sources(user_id, is_archived);
create index expenses_user_date_idx on public.expenses(user_id, date desc);
create index expenses_user_category_idx on public.expenses(user_id, category_id);
create index expenses_user_source_idx on public.expenses(user_id, source_id);
create index income_user_date_idx on public.income(user_id, date desc);
create index income_user_source_idx on public.income(user_id, source_id);
create index lending_user_due_date_idx on public.lending(user_id, due_date) where status <> 'paid';
create index repayments_user_lending_idx on public.repayments(user_id, lending_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.seed_user_categories(target_user_id uuid)
returns void
language sql
set search_path = public
as $$
  insert into public.categories (user_id, name, icon)
  select target_user_id, category_name, category_icon
  from (values
    ('Food', 'utensils'), ('Transport', 'car'), ('Shopping', 'shopping-bag'),
    ('Bills', 'receipt'), ('Entertainment', 'film'), ('Health', 'heart-pulse'),
    ('Education', 'graduation-cap'), ('Travel', 'plane'),
    ('Subscriptions', 'repeat'), ('Other', 'circle-ellipsis')
  ) as defaults(category_name, category_icon)
  on conflict (user_id, name) do nothing;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), new.email)
  on conflict (id) do nothing;
  perform public.seed_user_categories(new.id);
  return new;
end;
$$;

create or replace function public.enforce_lending_due_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.due_date is null and new.duration_days is not null then
    new.due_date = new.lent_date + new.duration_days;
  end if;
  if new.status in ('pending', 'overdue') then
    new.status = case when new.due_date < current_date then 'overdue' else 'pending' end;
  end if;
  return new;
end;
$$;

create or replace function public.validate_repayment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  loan_owner uuid;
  loan_amount numeric(14, 2);
  previously_repaid numeric(14, 2);
begin
  select user_id, original_amount into loan_owner, loan_amount
  from public.lending where id = new.lending_id for update;
  if not found then
    raise exception 'Lending record not found';
  end if;
  if loan_owner <> new.user_id then
    raise exception 'Repayment must belong to the lending record owner';
  end if;
  select coalesce(sum(amount), 0) into previously_repaid
  from public.repayments
  where lending_id = new.lending_id and id is distinct from new.id;
  if previously_repaid + new.amount > loan_amount then
    raise exception 'Repayment cannot exceed the remaining amount';
  end if;
  return new;
end;
$$;

create or replace function public.refresh_lending_status()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_lending_id uuid := coalesce(new.lending_id, old.lending_id);
begin
  update public.lending l
  set status = case
      when coalesce((select sum(r.amount) from public.repayments r where r.lending_id = l.id), 0) >= l.original_amount then 'paid'
      when coalesce((select sum(r.amount) from public.repayments r where r.lending_id = l.id), 0) > 0 then 'partially_paid'
      when l.due_date < current_date then 'overdue'
      else 'pending'
    end,
    updated_at = timezone('utc', now())
  where l.id = target_lending_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger sources_set_updated_at before update on public.sources for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger income_set_updated_at before update on public.income for each row execute function public.set_updated_at();
create trigger lending_set_updated_at before update on public.lending for each row execute function public.set_updated_at();
create trigger lending_due_date before insert or update of lent_date, duration_days, due_date, status on public.lending for each row execute function public.enforce_lending_due_date();
create trigger repayments_validate before insert or update on public.repayments for each row execute function public.validate_repayment();
create trigger repayments_refresh_lending after insert or update or delete on public.repayments for each row execute function public.refresh_lending_status();
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.seed_user_categories(uuid) from public;

-- Backfill profiles and default categories for any users that existed before this migration.
insert into public.profiles (id, name, email)
select id, coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'), email
from auth.users
on conflict (id) do nothing;

select public.seed_user_categories(id) from auth.users;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.sources enable row level security;
alter table public.expenses enable row level security;
alter table public.income enable row level security;
alter table public.lending enable row level security;
alter table public.repayments enable row level security;

grant select, insert, update, delete on public.profiles, public.categories, public.sources, public.expenses, public.income, public.lending, public.repayments to authenticated;

create policy "Users manage own profile" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Users manage own categories" on public.categories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own sources" on public.sources for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own expenses" on public.expenses for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own income" on public.income for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own lending" on public.lending for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own repayments" on public.repayments for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
