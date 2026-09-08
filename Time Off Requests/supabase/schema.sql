create extension if not exists pgcrypto;

create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  department text not null,
  manager text not null,
  time_off_type text not null,
  start_date date not null,
  end_date date not null,
  partial_day text not null default 'Full days',
  business_days numeric(4, 1) not null,
  reason text default '',
  status text not null default 'in_review',
  decision_note text default '',
  reviewed_by text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint time_off_requests_status_check check (status in ('in_review', 'approved', 'denied')),
  constraint time_off_requests_date_check check (end_date >= start_date),
  constraint time_off_requests_business_days_check check (business_days > 0)
);

alter table public.time_off_requests enable row level security;

create index if not exists time_off_requests_name_idx
  on public.time_off_requests (last_name, first_name);

create index if not exists time_off_requests_dates_idx
  on public.time_off_requests (start_date, end_date);

create index if not exists time_off_requests_status_idx
  on public.time_off_requests (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists time_off_requests_set_updated_at on public.time_off_requests;

create trigger time_off_requests_set_updated_at
before update on public.time_off_requests
for each row
execute function public.set_updated_at();
