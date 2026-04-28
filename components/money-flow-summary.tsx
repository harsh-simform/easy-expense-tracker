import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MoneyFlowSummary({
  income,
  outflow,
  emphasize,
}: {
  income: number;
  outflow: number;
  emphasize: "income" | "outcome";
}) {
  const discretionary = Math.max(0, income - outflow);
  const outflowPct = income > 0 ? Math.min(100, (outflow / income) * 100) : 0;
  const discretionaryPct = Math.max(0, 100 - outflowPct);
  const overshoot = outflow > income;

  return (
    <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        Monthly money flow
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Income"
          value={formatINR(income)}
          icon={TrendingUp}
          tone="emerald"
          highlight={emphasize === "income"}
          href="/income"
        />
        <Stat
          label="Recurring out"
          value={formatINR(outflow)}
          icon={TrendingDown}
          tone="orange"
          highlight={emphasize === "outcome"}
          href="/outcome"
        />
        <Stat
          label="Discretionary"
          value={formatINR(discretionary)}
          icon={Wallet}
          tone={overshoot ? "red" : "primary"}
          hint={overshoot ? "outflow exceeds income" : "for day-to-day spend"}
        />
      </div>

      {income > 0 && (
        <div className="space-y-1.5">
          <div
            className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
            aria-label="Income breakdown"
          >
            <span
              className="bg-orange-500/80"
              style={{ width: `${outflowPct}%` }}
            />
            <span
              className={cn(overshoot ? "bg-red-500/40" : "bg-emerald-500/70")}
              style={{ width: `${discretionaryPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>{Math.round(outflowPct)}% locked in recurring outflow</span>
            <span>{Math.round(discretionaryPct)}% free to spend</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
  highlight,
  href,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "orange" | "primary" | "red";
  highlight?: boolean;
  href?: string;
  hint?: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    orange: "text-orange-600 dark:text-orange-400",
    primary: "text-foreground",
    red: "text-red-600 dark:text-red-400",
  };

  const content = (
    <div
      className={cn(
        "flex h-full flex-col gap-1 rounded-lg p-2 transition-colors",
        highlight ? "bg-foreground/5 ring-1 ring-foreground/10" : "",
        href && "hover:bg-foreground/5",
      )}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className={cn("size-3", toneClass[tone])} />
        <span className="truncate">{label}</span>
        {href && !highlight && <ArrowRight className="ml-auto size-3 opacity-40" />}
      </div>
      <div className={cn("text-base font-semibold tabular-nums", toneClass[tone])}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );

  if (href && !highlight) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
