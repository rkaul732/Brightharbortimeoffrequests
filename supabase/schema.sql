create extension if not exists pgcrypto;

create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  employee_user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  department text not null,
  program text not null default 'Unassigned',
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

alter table public.time_off_requests
  add column if not exists program text not null default 'Unassigned';

alter table public.time_off_requests
  add column if not exists employee_user_id uuid references auth.users(id) on delete set null;

alter table public.time_off_requests
  add column if not exists pending_reminder_sent_at timestamptz;

alter table public.time_off_requests enable row level security;

create table if not exists public.employee_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  pronouns text not null default '',
  program text not null default '',
  manager text not null default '',
  account_type text not null default 'employee',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint employee_profiles_email_check check (right(lower(email), 17) = '@brightharbor.org'),
  constraint employee_profiles_account_type_check check (account_type in ('employee', 'admin')),
  constraint employee_profiles_program_check check (
    program = ''
    or program in (
      'Access',
      'ISC',
      'Outpatient',
      'Front Desk Professionals',
      'SOS',
      'Shore Haven',
      'Recovery',
      'Nursing Case Management',
      'On Point/Arrive Together',
      'ICM Blue'
    )
  )
);

alter table public.employee_profiles enable row level security;

alter table public.employee_profiles
  add column if not exists account_type text not null default 'employee';

alter table public.employee_profiles
  drop constraint if exists employee_profiles_program_check;

alter table public.employee_profiles
  drop constraint if exists employee_profiles_account_type_check;

alter table public.employee_profiles
  add constraint employee_profiles_account_type_check check (account_type in ('employee', 'admin'));

create table if not exists public.admin_sign_ins (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  sign_in_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_sign_ins enable row level security;

create index if not exists time_off_requests_name_idx
  on public.time_off_requests (last_name, first_name);

create index if not exists time_off_requests_dates_idx
  on public.time_off_requests (start_date, end_date);

create index if not exists time_off_requests_status_idx
  on public.time_off_requests (status);

create index if not exists time_off_requests_program_idx
  on public.time_off_requests (program);

create index if not exists time_off_requests_employee_user_idx
  on public.time_off_requests (employee_user_id);

create index if not exists time_off_requests_pending_reminder_idx
  on public.time_off_requests (status, created_at)
  where pending_reminder_sent_at is null;

create index if not exists employee_profiles_name_idx
  on public.employee_profiles (last_name, first_name);

create index if not exists employee_profiles_account_type_idx
  on public.employee_profiles (account_type);

create index if not exists admin_sign_ins_email_date_idx
  on public.admin_sign_ins (admin_email, sign_in_at desc);

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

drop trigger if exists employee_profiles_set_updated_at on public.employee_profiles;

create trigger employee_profiles_set_updated_at
before update on public.employee_profiles
for each row
execute function public.set_updated_at();
