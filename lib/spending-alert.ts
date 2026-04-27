import {
  getKpis,
  getCategoryBreakdown,
  listIncomeSources,
  type CategoryBreakdown,
} from "@/lib/queries";
import type { IncomeSource } from "@/types/database";

export type AlertSeverity = "ok" | "watch" | "warning" | "critical";

export type SpendingAlert = {
  enabled: boolean;
  severity: AlertSeverity;
  salary: number;
  obligations: number;
  discretionaryBudget: number;
  monthSpent: number;
  proratedBudget: number;
  projectedMonthEnd: number;
  overshootPct: number;
  daysInMonth: number;
  dayOfMonth: number;
  daysRemaining: number;
  safeDailyRemaining: number;
  headline: string;
  message: string;
  actions: string[];
  topCategories: Array<{ name: string; total: number; share: number }>;
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));

function totalsFromSources(sources: IncomeSource[]) {
  let salary = 0;
  let obligations = 0;
  for (const s of sources) {
    if (!s.active) continue;
    const amt = Number(s.amount);
    if (s.kind === "salary") salary += amt;
    else if (s.kind === "sip" || s.kind === "investment") obligations += amt;
  }
  return { salary, obligations };
}

function pickSeverity(
  spent: number,
  prorated: number,
  discretionary: number,
  projected: number,
): AlertSeverity {
  if (discretionary <= 0) return spent > 0 ? "critical" : "ok";
  if (spent >= discretionary) return "critical";
  if (projected >= discretionary * 1.1) return "critical";
  if (spent >= prorated * 1.5 || projected >= discretionary) return "warning";
  if (spent >= prorated * 1.2) return "watch";
  return "ok";
}

function buildActions(
  severity: AlertSeverity,
  safeDailyRemaining: number,
  daysRemaining: number,
  obligations: number,
  topCategories: Array<{ name: string; total: number; share: number }>,
): string[] {
  if (severity === "ok") return [];

  const actions: string[] = [];

  if (safeDailyRemaining > 0 && daysRemaining > 0) {
    actions.push(
      `Cap daily spend at ${inr(safeDailyRemaining)} for the next ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} to stay within your discretionary budget.`,
    );
  } else {
    actions.push(
      `You've already crossed the discretionary budget for this month. Pause non-essential spends until next month.`,
    );
  }

  if (obligations > 0) {
    actions.push(
      `Remember ${inr(obligations)} is locked in for SIPs/investments — protect it before any extra spend.`,
    );
  }

  const top = topCategories[0];
  if (top && top.share >= 0.25) {
    actions.push(
      `${top.name} is ${Math.round(top.share * 100)}% of this month — biggest lever to cut.`,
    );
  }
  const second = topCategories[1];
  if (second && second.share >= 0.15) {
    actions.push(
      `Watch ${second.name} too (${Math.round(second.share * 100)}% of spend).`,
    );
  }

  if (severity === "critical") {
    actions.push(`Move any incoming amount straight to savings before it gets spent.`);
  }

  return actions;
}

export async function getSpendingAlert(): Promise<SpendingAlert> {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = Math.max(0, daysInMonth - dayOfMonth);

  const [kpis, breakdown, sources] = await Promise.all([
    getKpis(),
    getCategoryBreakdown(),
    listIncomeSources(),
  ]);

  const { salary, obligations } = totalsFromSources(sources);

  const empty: SpendingAlert = {
    enabled: false,
    severity: "ok",
    salary: 0,
    obligations: 0,
    discretionaryBudget: 0,
    monthSpent: 0,
    proratedBudget: 0,
    projectedMonthEnd: 0,
    overshootPct: 0,
    daysInMonth,
    dayOfMonth,
    daysRemaining,
    safeDailyRemaining: 0,
    headline: "",
    message: "",
    actions: [],
    topCategories: [],
  };

  if (salary <= 0) return empty;

  const discretionaryBudget = Math.max(0, salary - obligations);
  const monthSpent = kpis.monthTotal;
  const proratedBudget = discretionaryBudget * (dayOfMonth / daysInMonth);
  const projectedMonthEnd = (monthSpent / Math.max(1, dayOfMonth)) * daysInMonth;
  const overshootPct =
    proratedBudget > 0 ? (monthSpent - proratedBudget) / proratedBudget : 0;
  const severity = pickSeverity(monthSpent, proratedBudget, discretionaryBudget, projectedMonthEnd);

  const safeRemaining = Math.max(0, discretionaryBudget - monthSpent);
  const safeDailyRemaining = daysRemaining > 0 ? safeRemaining / daysRemaining : 0;

  const totalForShare = (breakdown as CategoryBreakdown[]).reduce(
    (a, c) => a + c.total,
    0,
  );
  const topCategories = (breakdown as CategoryBreakdown[]).slice(0, 3).map((c) => ({
    name: c.categoryName,
    total: c.total,
    share: totalForShare > 0 ? c.total / totalForShare : 0,
  }));

  const headlines: Record<AlertSeverity, string> = {
    critical: "You're spending way more than you can afford",
    warning: "On track to overshoot your discretionary budget",
    watch: "Spending is running ahead of plan",
    ok: "Spending is on track",
  };
  const headline = headlines[severity];

  const message =
    severity === "ok"
      ? `Spent ${inr(monthSpent)} of ${inr(discretionaryBudget)} discretionary so far — within the prorated ${inr(proratedBudget)} for day ${dayOfMonth}.`
      : `Spent ${inr(monthSpent)} by day ${dayOfMonth} vs a prorated ${inr(proratedBudget)} (${Math.round(overshootPct * 100)}% over). At this pace, month-end lands at ~${inr(projectedMonthEnd)} against a discretionary budget of ${inr(discretionaryBudget)} (salary ${inr(salary)} − obligations ${inr(obligations)}).`;

  return {
    enabled: true,
    severity,
    salary,
    obligations,
    discretionaryBudget,
    monthSpent,
    proratedBudget,
    projectedMonthEnd,
    overshootPct,
    daysInMonth,
    dayOfMonth,
    daysRemaining,
    safeDailyRemaining,
    headline,
    message,
    actions: buildActions(severity, safeDailyRemaining, daysRemaining, obligations, topCategories),
    topCategories,
  };
}
