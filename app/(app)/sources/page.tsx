import { SourcesManager } from "@/components/sources-manager";
import { listIncomeSources } from "@/lib/queries";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await listIncomeSources();

  const totals = sources.reduce(
    (acc, s) => {
      if (!s.active) return acc;
      const amt = Number(s.amount);
      if (s.kind === "salary") acc.salary += amt;
      else if (s.kind === "sip" || s.kind === "investment") acc.obligations += amt;
      return acc;
    },
    { salary: 0, obligations: 0 },
  );
  const discretionary = Math.max(0, totals.salary - totals.obligations);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
        <p className="text-sm text-muted-foreground">
          Salary, SIPs, and recurring investments. The dashboard alert uses
          salary minus obligations as your discretionary budget.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SummaryTile label="Salary" value={formatINR(totals.salary)} tone="emerald" />
        <SummaryTile
          label="Obligations"
          value={formatINR(totals.obligations)}
          tone="amber"
        />
        <SummaryTile
          label="Discretionary"
          value={formatINR(discretionary)}
          tone="primary"
        />
      </div>

      <SourcesManager sources={sources} />
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "primary";
}) {
  const ring =
    tone === "emerald"
      ? "ring-emerald-500/30 bg-emerald-500/5"
      : tone === "amber"
        ? "ring-amber-500/30 bg-amber-500/5"
        : "ring-foreground/10 bg-card";
  return (
    <div className={`rounded-lg p-3 ring-1 ${ring}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
