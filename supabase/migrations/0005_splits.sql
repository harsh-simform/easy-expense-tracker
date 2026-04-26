-- Money splitter: per-user `people` (autocomplete pool) and `transaction_splits`
-- (per-person share of an expense). A split is "owed to me" while paid_at is
-- null, and "settled" once it's set.

create table if not exists people (
  id uuid primary key default uuid_generate_v4(),
  owner_email text not null default auth.jwt() ->> 'email',
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_email, name)
);

create index if not exists people_owner_idx on people (owner_email);

create table if not exists transaction_splits (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  person_id uuid not null references people(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (transaction_id, person_id)
);

create index if not exists splits_tx_idx on transaction_splits (transaction_id);
create index if not exists splits_person_idx on transaction_splits (person_id);
create index if not exists splits_unpaid_idx on transaction_splits (paid_at)
  where paid_at is null;

alter table people enable row level security;
alter table transaction_splits enable row level security;

drop policy if exists owner_all_people on people;
create policy owner_all_people on people for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email')
         and owner_email = auth.jwt() ->> 'email')
  with check (public.is_allowed_email(auth.jwt() ->> 'email')
              and owner_email = auth.jwt() ->> 'email');

-- Splits inherit ownership from their parent transaction. We don't denormalize
-- owner_email here so a split can never end up "orphaned" if you ever migrate
-- a transaction to a different owner.
drop policy if exists owner_all_splits on transaction_splits;
create policy owner_all_splits on transaction_splits for all to authenticated
  using (
    public.is_allowed_email(auth.jwt() ->> 'email')
    and exists (
      select 1 from transactions t
       where t.id = transaction_splits.transaction_id
         and t.owner_email = auth.jwt() ->> 'email'
    )
  )
  with check (
    public.is_allowed_email(auth.jwt() ->> 'email')
    and exists (
      select 1 from transactions t
       where t.id = transaction_splits.transaction_id
         and t.owner_email = auth.jwt() ->> 'email'
    )
  );
