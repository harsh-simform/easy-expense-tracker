import { CalendarDays } from "lucide-react";
import { RecurringFlowsManager } from "@/components/recurring-flows-manager";
import { MoneyFlowSummary } from "@/components/money-flow-summary";
import { listRecurringFlows, monthlyEquivalent } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function OutcomePage() {
  const flows = await listRecurringFlows();
  const outcome = flows.filter((f) => f.direction === "outcome");

  const totalIncome = flows
    .filter((f) => f.direction === "income" && f.active)
    .reduce((acc, f) => acc + monthlyEquivalent(f), 0);
  const totalOutflow = flows
    .filter((f) => f.direction === "outcome" && f.active)
    .reduce((acc, f) => acc + monthlyEquivalent(f), 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Outcome</h1>
        <p className="text-sm text-muted-foreground">
          Money that auto-leaves your account every month or year — SIPs, EMIs,
          rent, premiums, subscriptions. Day-to-day spending stays in
          Transactions; this section is for the predictable, scheduled stuff.
        </p>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Pick monthly or yearly per item — yearly auto-converts to monthly.
        </div>
      </div>

      <MoneyFlowSummary
        income={totalIncome}
        outflow={totalOutflow}
        emphasize="outcome"
      />

      <RecurringFlowsManager direction="outcome" flows={outcome} />
    </div>
  );
}
