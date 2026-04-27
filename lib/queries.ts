import { createClient } from "@/lib/supabase/server";
import {
  startOfMonthISO,
  endOfMonthISO,
  startOfYearISO,
  todayISO,
  dayOfMonth,
} from "@/lib/format";
import type {
  Category,
  IncomeSource,
  Person,
  Transaction,
  TransactionWithCategory,
} from "@/types/database";

export async function listCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("archived", false)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listIncomeSources(): Promise<IncomeSource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("income_sources")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as IncomeSource[];
}

export async function listPeople(): Promise<Person[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getOutstandingTotal(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_splits")
    .select("amount")
    .is("paid_at", null);
  if (error) throw error;
  return (data ?? []).reduce((acc, r) => acc + Number(r.amount), 0);
}

// Effective spent: transaction.amount minus what others owe you for it (whether
// they've paid you back yet or not — settled splits are someone else's expense
// that just happened to flow through your wallet, so they don't belong in your
// "spent" total).
type RowWithSplits = {
  amount: number;
  splits: { amount: number }[] | null;
};
const effectiveAmount = (r: RowWithSplits) => {
  const splitsTotal = (r.splits ?? []).reduce((a, s) => a + Number(s.amount), 0);
  return Math.max(0, Number(r.amount) - splitsTotal);
};

export async function getKpis() {
  const supabase = await createClient();
  const today = new Date();
  const monthStart = startOfMonthISO(today);
  const yearStart = startOfYearISO(today);

  const [{ data: monthRows }, { data: yearRows }] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, splits:transaction_splits(amount)")
      .gte("occurred_on", monthStart)
      .lte("occurred_on", todayISO()),
    supabase
      .from("transactions")
      .select("amount, splits:transaction_splits(amount)")
      .gte("occurred_on", yearStart)
      .lte("occurred_on", todayISO()),
  ]);

  const sum = (rows: RowWithSplits[] | null) =>
    (rows ?? []).reduce((acc, r) => acc + effectiveAmount(r), 0);

  const monthTotal = sum(monthRows);
  const yearTotal = sum(yearRows);
  const dailyAvg = monthTotal / Math.max(1, dayOfMonth(today));

  return { monthTotal, yearTotal, dailyAvg };
}

export async function getCurrentMonthTransactions(): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "*, category:categories(id,name,icon,color), splits:transaction_splits(*, person:people(id,name))",
    )
    .gte("occurred_on", startOfMonthISO())
    .lte("occurred_on", endOfMonthISO())
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as TransactionWithCategory[]) ?? [];
}

export async function getTransactionsInRange(
  from: string,
  to: string,
  categoryIds?: string[],
): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  let q = supabase
    .from("transactions")
    .select(
      "*, category:categories(id,name,icon,color), splits:transaction_splits(*, person:people(id,name))",
    )
    .gte("occurred_on", from)
    .lte("occurred_on", to)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (categoryIds && categoryIds.length > 0) {
    q = q.in("category_id", categoryIds);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as TransactionWithCategory[]) ?? [];
}

export type CategoryBreakdown = {
  categoryId: string | null;
  categoryName: string;
  color: string | null;
  total: number;
};

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "amount, splits:transaction_splits(amount), category:categories(id,name,color)",
    )
    .gte("occurred_on", startOfMonthISO())
    .lte("occurred_on", endOfMonthISO());
  if (error) throw error;

  const map = new Map<string, CategoryBreakdown>();
  for (const row of (data ?? []) as Array<{
    amount: number;
    splits: { amount: number }[] | null;
    category: { id: string; name: string; color: string | null } | null;
  }>) {
    const key = row.category?.id ?? "uncategorized";
    const existing = map.get(key);
    const eff = effectiveAmount(row);
    if (existing) {
      existing.total += eff;
    } else {
      map.set(key, {
        categoryId: row.category?.id ?? null,
        categoryName: row.category?.name ?? "Uncategorized",
        color: row.category?.color ?? null,
        total: eff,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export async function getDailyTrend(days = 30) {
  const supabase = await createClient();
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const fromISO = from.toISOString().slice(0, 10);
  const toISO = to.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, occurred_on, splits:transaction_splits(amount)")
    .gte("occurred_on", fromISO)
    .lte("occurred_on", toISO);
  if (error) throw error;

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of (data ?? []) as Array<RowWithSplits & { occurred_on: string }>) {
    buckets.set(
      r.occurred_on,
      (buckets.get(r.occurred_on) ?? 0) + effectiveAmount(r),
    );
  }
  return [...buckets.entries()].map(([date, total]) => ({ date, total }));
}

export type BudgetProgress = {
  categoryId: string;
  categoryName: string;
  color: string | null;
  monthlyLimit: number;
  spent: number;
};

export async function getBudgetProgress(): Promise<BudgetProgress[]> {
  const supabase = await createClient();
  const monthStart = startOfMonthISO();

  const [{ data: cats }, { data: budgets }, { data: txs }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,color")
      .eq("archived", false)
      .order("sort_order"),
    supabase.from("budgets").select("*").lte("effective_from", todayISO()),
    supabase
      .from("transactions")
      .select("amount, category_id, splits:transaction_splits(amount)")
      .gte("occurred_on", monthStart)
      .lte("occurred_on", endOfMonthISO()),
  ]);

  const latestBudgetByCat = new Map<string, number>();
  for (const b of (budgets ?? []) as {
    category_id: string;
    monthly_limit: number;
    effective_from: string;
  }[]) {
    const prev = latestBudgetByCat.get(b.category_id);
    if (prev === undefined) latestBudgetByCat.set(b.category_id, Number(b.monthly_limit));
    else latestBudgetByCat.set(b.category_id, Number(b.monthly_limit));
  }

  const spentByCat = new Map<string, number>();
  for (const t of (txs ?? []) as Array<
    RowWithSplits & { category_id: string | null }
  >) {
    if (!t.category_id) continue;
    spentByCat.set(
      t.category_id,
      (spentByCat.get(t.category_id) ?? 0) + effectiveAmount(t),
    );
  }

  return ((cats ?? []) as Pick<Category, "id" | "name" | "color">[]).map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    color: c.color,
    monthlyLimit: latestBudgetByCat.get(c.id) ?? 0,
    spent: spentByCat.get(c.id) ?? 0,
  }));
}

export type OutstandingSplitRow = {
  splitId: string;
  amount: number;
  paidAt: string | null;
  transaction: {
    id: string;
    description: string | null;
    occurredOn: string;
    totalAmount: number;
    categoryName: string | null;
    categoryColor: string | null;
  };
};

export type OutstandingByPerson = {
  personId: string;
  personName: string;
  total: number;
  splits: OutstandingSplitRow[];
};

export async function getOutstandingByPerson(): Promise<OutstandingByPerson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transaction_splits")
    .select(
      "id, amount, paid_at, person:people(id,name), transaction:transactions(id,description,occurred_on,amount,category:categories(name,color))",
    )
    .is("paid_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  type Row = {
    id: string;
    amount: number;
    paid_at: string | null;
    person: { id: string; name: string } | null;
    transaction: {
      id: string;
      description: string | null;
      occurred_on: string;
      amount: number;
      category: { name: string; color: string | null } | null;
    } | null;
  };

  const grouped = new Map<string, OutstandingByPerson>();
  for (const r of (data ?? []) as unknown as Row[]) {
    if (!r.person || !r.transaction) continue;
    const bucket =
      grouped.get(r.person.id) ??
      ({
        personId: r.person.id,
        personName: r.person.name,
        total: 0,
        splits: [] as OutstandingSplitRow[],
      } satisfies OutstandingByPerson);
    bucket.total += Number(r.amount);
    bucket.splits.push({
      splitId: r.id,
      amount: Number(r.amount),
      paidAt: r.paid_at,
      transaction: {
        id: r.transaction.id,
        description: r.transaction.description,
        occurredOn: r.transaction.occurred_on,
        totalAmount: Number(r.transaction.amount),
        categoryName: r.transaction.category?.name ?? null,
        categoryColor: r.transaction.category?.color ?? null,
      },
    });
    grouped.set(r.person.id, bucket);
  }
  return [...grouped.values()].sort((a, b) => b.total - a.total);
}

export type { Transaction, TransactionWithCategory, Category };
