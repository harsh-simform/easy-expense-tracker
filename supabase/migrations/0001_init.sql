-- Expense tracker schema
create extension if not exists "uuid-ossp";

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  icon text,
  color text,
  keywords text[] not null default '{}',
  is_default boolean not null default false,
  archived boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  category_id uuid references categories(id) on delete set null,
  occurred_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists transactions_occurred_on_idx on transactions (occurred_on desc);
create index if not exists transactions_category_idx on transactions (category_id);

create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references categories(id) on delete cascade,
  monthly_limit numeric(12,2) not null check (monthly_limit >= 0),
  effective_from date not null default date_trunc('month', current_date)::date,
  unique (category_id, effective_from)
);

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists transactions_set_updated_at on transactions;
create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

-- Allowed-email function. Single source of truth for the personal-use allowlist.
-- Change the email by re-running this CREATE OR REPLACE; the policies below
-- pick up the new value immediately, no policy rewrite needed.
create or replace function public.allowed_email() returns text
  language sql immutable parallel safe
  as $$ select 'harsh.m@simformsolutions.com'::text $$;

alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;

drop policy if exists owner_all_categories on categories;
create policy owner_all_categories on categories for all to authenticated
  using (auth.jwt() ->> 'email' = public.allowed_email())
  with check (auth.jwt() ->> 'email' = public.allowed_email());

drop policy if exists owner_all_transactions on transactions;
create policy owner_all_transactions on transactions for all to authenticated
  using (auth.jwt() ->> 'email' = public.allowed_email())
  with check (auth.jwt() ->> 'email' = public.allowed_email());

drop policy if exists owner_all_budgets on budgets;
create policy owner_all_budgets on budgets for all to authenticated
  using (auth.jwt() ->> 'email' = public.allowed_email())
  with check (auth.jwt() ->> 'email' = public.allowed_email());
