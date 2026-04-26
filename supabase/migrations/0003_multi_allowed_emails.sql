-- Allow more than one user. Replaces the single-email allowlist with an array
-- of emails. To add or remove users later, re-run this CREATE OR REPLACE with
-- an updated array; policies read the function on every check, so the change
-- takes effect immediately without rewriting policies.

create or replace function public.allowed_emails() returns text[]
  language sql immutable parallel safe
  as $$ select array[
    'harsh.m@simformsolutions.com',
    'second.user@example.com',
    'third.user@example.com'
  ]::text[] $$;

create or replace function public.is_allowed_email(email text) returns boolean
  language sql stable parallel safe
  as $$ select email is not null and email = any(public.allowed_emails()) $$;

-- Keep the old single-email function as a thin shim so anything that still
-- references it (older code, manual queries) keeps working — returns the
-- first entry in the list.
create or replace function public.allowed_email() returns text
  language sql immutable parallel safe
  as $$ select (public.allowed_emails())[1] $$;

drop policy if exists owner_all_categories on categories;
create policy owner_all_categories on categories for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email'))
  with check (public.is_allowed_email(auth.jwt() ->> 'email'));

drop policy if exists owner_all_transactions on transactions;
create policy owner_all_transactions on transactions for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email'))
  with check (public.is_allowed_email(auth.jwt() ->> 'email'));

drop policy if exists owner_all_budgets on budgets;
create policy owner_all_budgets on budgets for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email'))
  with check (public.is_allowed_email(auth.jwt() ->> 'email'));
