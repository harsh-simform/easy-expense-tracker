-- Seed default categories. Idempotent via ON CONFLICT.
insert into categories (name, icon, color, keywords, is_default, sort_order) values
  ('Food',             'utensils',     '#f97316', array['food','meal','zomato','swiggy','lunch','dinner','breakfast','restaurant','cafe','coffee','tea','snack'], true, 10),
  ('Fuel & Transport', 'fuel',         '#3b82f6', array['petrol','diesel','fuel','uber','ola','cab','taxi','metro','bus','train','auto','parking','rapido'], true, 20),
  ('Groceries',        'shopping-cart','#22c55e', array['bigbasket','blinkit','zepto','dmart','grocery','vegetables','milk','fruits'], true, 30),
  ('Shopping',         'shopping-bag', '#ec4899', array['amazon','flipkart','myntra','ajio','shopping','clothes','shoes'], true, 40),
  ('Bills',            'receipt',      '#eab308', array['electricity','water','wifi','internet','mobile','recharge','gas','bill','bsnl','jio','airtel'], true, 50),
  ('Rent',             'home',         '#8b5cf6', array['rent','maintenance'], true, 60),
  ('Health',           'heart-pulse',  '#ef4444', array['medicine','pharmacy','doctor','hospital','gym','fitness','medical'], true, 70),
  ('Entertainment',    'tv',           '#a855f7', array['netflix','spotify','movie','prime','hotstar','youtube','game'], true, 80),
  ('Travel',           'plane',        '#06b6d4', array['flight','hotel','airbnb','irctc','vacation','trip','goibibo','makemytrip'], true, 90),
  ('Other',            'circle',       '#64748b', array[]::text[], true, 999)
on conflict (name) do nothing;
