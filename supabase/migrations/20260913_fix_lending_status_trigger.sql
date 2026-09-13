-- Migration: 20260913_fix_lending_status_trigger.sql
-- Fixes PostgreSQL error: column "status" is of type lending_status but expression is of type text
-- when inserting/updating repayments or modifying lending due dates.

-- 1. Fix the refresh_lending_status function to explicitly cast string literals to public.lending_status
create or replace function public.refresh_lending_status()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_lending_id uuid := coalesce(new.lending_id, old.lending_id);
begin
  update public.lending l
  set status = (case
      when coalesce((select sum(r.amount) from public.repayments r where r.lending_id = l.id), 0) >= l.original_amount then 'paid'::public.lending_status
      when coalesce((select sum(r.amount) from public.repayments r where r.lending_id = l.id), 0) > 0 then 'partially_paid'::public.lending_status
      when l.due_date < current_date then 'overdue'::public.lending_status
      else 'pending'::public.lending_status
    end),
    updated_at = timezone('utc', now())
  where l.id = target_lending_id;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- 2. Also ensure enforce_lending_due_date explicitly casts status
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
    new.status = (case when new.due_date < current_date then 'overdue'::public.lending_status else 'pending'::public.lending_status end);
  end if;
  return new;
end;
$$;
