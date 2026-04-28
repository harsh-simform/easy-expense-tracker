import { CalendarDays } from "lucide-react";
import { RecurringFlowsManager } from "@/components/recurring-flows-manager";
import { MoneyFlowSummary } from "@/components/money-flow-summary";
import { listRecurringFlows, monthlyEquivalent } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const flows = await listRecurringFlows();
  const income = flows.filter((f) => f.direction === "income");

  const totalIncome = flows
    .filter((f) => f.direction === "income" && f.active)
    .reduce((acc, f) => acc + monthlyEquivalent(f), 0);
  const totalOutflow = flows
    .filter((f) => f.direction === "outcome" && f.active)
    .reduce((acc, f) => acc + monthlyEquivalent(f), 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Income</h1>
        <p className="text-sm text-muted-foreground">
          What lands in your account every month — salary, bonus average, RSU
          vests, freelance, rent received. The dashboard alert subtracts your
          recurring outflows from this to know your real spending budget.
        </p>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Pick monthly or yearly per item — yearly auto-converts to monthly.
        </div>
      </div>

      <MoneyFlowSummary
        income={totalIncome}
        outflow={totalOutflow}
        emphasize="income"
      />

      <RecurringFlowsManager direction="income" flows={income} />
    </div>
  );
}
