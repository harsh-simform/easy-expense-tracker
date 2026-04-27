-- Per-user income / monthly-obligation sources. Drives the spending alert:
-- salary income minus fixed obligations (SIPs, recurring investments) defines
-- what's actually available for discretionary spend each month.

create table if not exists income_sources (
  id uuid primary key default uuid_generate_v4(),
  owner_email text not null default auth.jwt() ->> 'email',
  kind text not null check (kind in ('salary','sip','investment','other')),
  label text not null,
  amount numeric(12,2) not null check (amount >= 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_sources_owner_idx on income_sources (owner_email);

drop trigger if exists income_sources_set_updated_at on income_sources;
create trigger income_sources_set_updated_at
  before update on income_sources
  for each row execute function set_updated_at();

alter table income_sources enable row level security;

drop policy if exists owner_all_income_sources on income_sources;
create policy owner_all_income_sources on income_sources for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email')
         and owner_email = auth.jwt() ->> 'email')
  with check (public.is_allowed_email(auth.jwt() ->> 'email')
              and owner_email = auth.jwt() ->> 'email');
