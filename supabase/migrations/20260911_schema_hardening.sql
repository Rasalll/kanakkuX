-- Phase 2 hardening: make internal trigger functions non-RPC-callable and
-- add indexes covering foreign keys used by cascades and joins.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.seed_user_categories(uuid) from public, anon, authenticated;

create index expenses_category_id_idx on public.expenses(category_id);
create index expenses_source_id_idx on public.expenses(source_id);
create index income_source_id_idx on public.income(source_id);
create index repayments_lending_id_idx on public.repayments(lending_id);

create or replace function public.validate_expense_references()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.categories where id = new.category_id and user_id = new.user_id
  ) then
    raise exception 'Expense category must belong to the expense owner';
  end if;
  if new.source_id is not null and not exists (
    select 1 from public.sources where id = new.source_id and user_id = new.user_id
  ) then
    raise exception 'Expense source must belong to the expense owner';
  end if;
  return new;
end;
$$;

create or replace function public.validate_income_source()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.source_id is not null and not exists (
    select 1 from public.sources where id = new.source_id and user_id = new.user_id
  ) then
    raise exception 'Income source must belong to the income owner';
  end if;
  return new;
end;
$$;

create trigger expenses_validate_references
before insert or update of user_id, category_id, source_id on public.expenses
for each row execute function public.validate_expense_references();

create trigger income_validate_source
before insert or update of user_id, source_id on public.income
for each row execute function public.validate_income_source();

revoke all on function public.validate_expense_references() from public, anon, authenticated;
revoke all on function public.validate_income_source() from public, anon, authenticated;
