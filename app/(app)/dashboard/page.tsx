import { format } from "date-fns";
import { KpiCard } from "@/components/kpi-card";
import { CategoryPie } from "@/components/category-pie";
import { TrendChart } from "@/components/trend-chart";
import { TransactionList } from "@/components/transaction-list";
import {
  getKpis,
  getCategoryBreakdown,
  getDailyTrend,
  getCurrentMonthTransactions,
} from "@/lib/queries";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [kpis, breakdown, trend, transactions] = await Promise.all([
    getKpis(),
    getCategoryBreakdown(),
    getDailyTrend(30),
    getCurrentMonthTransactions(),
  ]);

  const now = new Date();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{format(now, "MMMM yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="This month"
          value={formatINR(kpis.monthTotal)}
          hint={format(now, "MMM yyyy")}
        />
        <KpiCard
          label="Daily avg"
          value={formatINR(kpis.dailyAvg)}
          hint={`Through ${format(now, "d MMM")}`}
        />
        <KpiCard
          label="This year"
          value={formatINR(kpis.yearTotal)}
          hint={format(now, "yyyy")}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CategoryPie data={breakdown} />
        <TrendChart data={trend} />
      </div>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">This month’s transactions</h2>
          <span className="text-xs text-muted-foreground">
            {transactions.length} item{transactions.length === 1 ? "" : "s"}
          </span>
        </div>
        <TransactionList
          transactions={transactions}
          emptyHint="No expenses this month yet. Tap + to add one."
        />
      </div>
    </div>
  );
}
