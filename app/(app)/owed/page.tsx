import { OwedList } from "@/components/owed-list";
import { getOutstandingByPerson, getOutstandingTotal } from "@/lib/queries";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwedPage() {
  const [groups, total] = await Promise.all([
    getOutstandingByPerson(),
    getOutstandingTotal(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Owed to me</h1>
          <p className="text-sm text-muted-foreground">
            Unpaid splits, grouped by person.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total outstanding</div>
          <div className="text-xl font-semibold tabular-nums">{formatINR(total)}</div>
        </div>
      </div>
      <OwedList groups={groups} />
    </div>
  );
}
