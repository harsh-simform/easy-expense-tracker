import { format } from "date-fns";
import { BudgetsEditor } from "@/components/budgets-editor";
import { getBudgetProgress } from "@/lib/queries";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const budgets = await getBudgetProgress();
  const totalLimit = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-muted-foreground">
          Set a monthly limit per category. {format(new Date(), "MMMM yyyy")}.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          Total this month
        </div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">
          {formatINR(totalSpent)}{" "}
          {totalLimit > 0 && (
            <span className="text-base font-normal text-muted-foreground">
              of {formatINR(totalLimit)}
            </span>
          )}
        </div>
      </div>

      <BudgetsEditor budgets={budgets} />
    </div>
  );
}
