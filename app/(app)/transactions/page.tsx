import { TransactionList } from "@/components/transaction-list";
import { TransactionsFilters } from "@/components/transactions-filters";
import { getTransactionsInRange } from "@/lib/queries";
import { startOfMonthISO, endOfMonthISO, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  from?: string;
  to?: string;
  categoryId?: string | string[];
}>;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const from = sp.from ?? startOfMonthISO();
  const to = sp.to ?? endOfMonthISO();
  const categoryIds = sp.categoryId
    ? Array.isArray(sp.categoryId)
      ? sp.categoryId
      : [sp.categoryId]
    : [];

  const transactions = await getTransactionsInRange(from, to, categoryIds);
  const total = transactions.reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            {transactions.length} item{transactions.length === 1 ? "" : "s"} ·{" "}
            <span className="font-medium text-foreground">{formatINR(total)}</span>
          </p>
        </div>
      </div>

      <TransactionsFilters from={from} to={to} categoryIds={categoryIds} />

      <TransactionList
        transactions={transactions}
        emptyHint="No transactions match these filters."
      />
    </div>
  );
}
