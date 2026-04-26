-- Switch from shared workspace to per-user data. Each allowed email gets its
-- own categories, transactions, and budgets — keyed by owner_email so we can
-- look it up directly from the JWT without a users table.

alter table categories add column if not exists owner_email text;
alter table transactions add column if not exists owner_email text;
alter table budgets add column if not exists owner_email text;

-- Backfill: assign any pre-existing rows to the first allowed email (the
-- original single user). After this, owner_email is required on inserts.
update categories
   set owner_email = (public.allowed_emails())[1]
 where owner_email is null;
update transactions
   set owner_email = (public.allowed_emails())[1]
 where owner_email is null;
update budgets
   set owner_email = (public.allowed_emails())[1]
 where owner_email is null;

alter table categories  alter column owner_email set not null;
alter table transactions alter column owner_email set not null;
alter table budgets      alter column owner_email set not null;

alter table categories  alter column owner_email set default auth.jwt() ->> 'email';
alter table transactions alter column owner_email set default auth.jwt() ->> 'email';
alter table budgets      alter column owner_email set default auth.jwt() ->> 'email';

-- Category names were globally unique; now they only need to be unique per user.
alter table categories drop constraint if exists categories_name_key;
create unique index if not exists categories_owner_name_uniq
  on categories (owner_email, name);

create index if not exists categories_owner_idx   on categories (owner_email);
create index if not exists transactions_owner_idx on transactions (owner_email);
create index if not exists budgets_owner_idx      on budgets (owner_email);

-- Tighten RLS: must be in the allowlist AND own the row.
drop policy if exists owner_all_categories on categories;
create policy owner_all_categories on categories for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email')
         and owner_email = auth.jwt() ->> 'email')
  with check (public.is_allowed_email(auth.jwt() ->> 'email')
              and owner_email = auth.jwt() ->> 'email');

drop policy if exists owner_all_transactions on transactions;
create policy owner_all_transactions on transactions for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email')
         and owner_email = auth.jwt() ->> 'email')
  with check (public.is_allowed_email(auth.jwt() ->> 'email')
              and owner_email = auth.jwt() ->> 'email');

drop policy if exists owner_all_budgets on budgets;
create policy owner_all_budgets on budgets for all to authenticated
  using (public.is_allowed_email(auth.jwt() ->> 'email')
         and owner_email = auth.jwt() ->> 'email')
  with check (public.is_allowed_email(auth.jwt() ->> 'email')
              and owner_email = auth.jwt() ->> 'email');

-- Seed the 10 default categories for every allowed email. Idempotent: re-running
-- this migration (or adding new emails to allowed_emails() and re-pushing) only
-- inserts what's missing, never duplicates.
insert into categories (owner_email, name, icon, color, keywords, is_default, sort_order)
select email, c.name, c.icon, c.color, c.keywords, true, c.sort_order
  from unnest(public.allowed_emails()) as email
  cross join (values
    ('Food',             'utensils',     '#f97316', array['food','meal','zomato','swiggy','lunch','dinner','breakfast','restaurant','cafe','coffee','tea','snack'],                                10),
    ('Fuel & Transport', 'fuel',         '#3b82f6', array['petrol','diesel','fuel','uber','ola','cab','taxi','metro','bus','train','auto','parking','rapido'],                                    20),
    ('Groceries',        'shopping-cart','#22c55e', array['bigbasket','blinkit','zepto','dmart','grocery','vegetables','milk','fruits'],                                                          30),
    ('Shopping',         'shopping-bag', '#ec4899', array['amazon','flipkart','myntra','ajio','shopping','clothes','shoes'],                                                                      40),
    ('Bills',            'receipt',      '#eab308', array['electricity','water','wifi','internet','mobile','recharge','gas','bill','bsnl','jio','airtel'],                                        50),
    ('Rent',             'home',         '#8b5cf6', array['rent','maintenance'],                                                                                                                  60),
    ('Health',           'heart-pulse',  '#ef4444', array['medicine','pharmacy','doctor','hospital','gym','fitness','medical'],                                                                   70),
    ('Entertainment',    'tv',           '#a855f7', array['netflix','spotify','movie','prime','hotstar','youtube','game'],                                                                        80),
    ('Travel',           'plane',        '#06b6d4', array['flight','hotel','airbnb','irctc','vacation','trip','goibibo','makemytrip'],                                                            90),
    ('Other',            'circle',       '#64748b', array[]::text[],                                                                                                                              999)
  ) as c(name, icon, color, keywords, sort_order)
on conflict (owner_email, name) do nothing;
