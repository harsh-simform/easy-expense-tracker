import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { RecurringFlowsManager } from "@/components/recurring-flows-manager";
import { listRecurringFlows, monthlyEquivalent } from "@/lib/queries";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OutcomePage() {
  const flows = await listRecurringFlows("outcome");

  const activeMonthly = flows
    .filter((f) => f.active)
    .reduce((acc, f) => acc + monthlyEquivalent(f), 0);
  const stoppedMonthly = flows
    .filter((f) => !f.active)
    .reduce((acc, f) => acc + monthlyEquivalent(f), 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Outcome</h1>
        <p className="text-sm text-muted-foreground">
          Recurring outflows — SIPs, EMIs, rent, premiums, subscriptions.
          Anything that auto-debits every month or year. Day-to-day spending
          still goes in Transactions.
        </p>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          Pick monthly or yearly per item — yearly auto-converts to monthly.
        </div>
      </div>

      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Total monthly outflow
        </div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">
          {formatINR(activeMonthly)}
        </div>
        {stoppedMonthly > 0 && (
          <div className="mt-1 text-xs text-muted-foreground">
            {formatINR(stoppedMonthly)} stopped (not counted)
          </div>
        )}
        <Link
          href="/income"
          className="mt-3 inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
        >
          Manage income <ArrowRight className="size-3" />
        </Link>
      </div>

      <RecurringFlowsManager direction="outcome" flows={flows} />
    </div>
  );
}
