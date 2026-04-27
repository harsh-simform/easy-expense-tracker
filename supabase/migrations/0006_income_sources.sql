-- Recurring money flows: scheduled income (salary, RSU, rent received…) and
-- scheduled outflows (SIPs, EMIs, premiums, rent paid…). Frequency is monthly
-- or yearly; yearly amounts are stored as-is and divided by 12 at read time.
-- Stopping a recurring flow keeps the row for history but excludes it from
-- the dashboard's overspending math.

create table if not exists recurring_flows (
  id uuid primary key default uuid_generate_v4(),
  owner_email text not null default auth.jwt() ->> 'email',
  direction text not null check (direction in ('income', 'outcome')),
  kind text not null,
  label text not null,
  amount numeric(12,2) not null check (amount >= 0),
  frequency text not null default 'monthly' check (frequency in ('monthly', 'yearly')),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Validate kind against the appropriate vocabulary for its direction.
  constraint recurring_flows_kind_check check (
    (direction = 'income' and kind in (
      'salary',
      'bonus',
      'rsu',
      'freelance',
      'consulting',
      'rental_income',
      'interest_savings',
      'fd_interest',
      'dividend',
      'spouse_contribution',
      'other_income'
    ))
    or
    (direction = 'outcome' and kind in (
      'sip',
      'elss',
      'ppf',
      'nps',
      'epf_voluntary',
      'rd',
      'stocks',
      'home_loan',
      'car_loan',
      'personal_loan',
      'education_loan',
      'rent',
      'term_insurance',
      'health_insurance',
      'society_maintenance',
      'credit_card',
      'subscription',
      'school_fees',
      'utilities',
      'other_outcome'
    ))
  )
);

create index if not exists recurring_flows_owner_idx on recurring_flows (owner_email);
create index if not exists recurring_flows_direction_idx on recurring_flows (owner_email, direction);

drop trigger if exists recurring_flows_set_updated_at on recurring_flows;
create trigger recurring_flows_set_updated_at
  before update on recurring_flows
  for each row execute function set_updated_at();

alter table recurring_flows enable row level security;

drop policy if exists owner_all_recurring_flows on recurring_flows;
create policy owner_all_recurring_flows on recurring_flows for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email')
         and owner_email = auth.jwt() ->> 'email')
  with check (public.is_allowed_email(auth.jwt() ->> 'email')
              and owner_email = auth.jwt() ->> 'email');
