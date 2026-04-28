import {
  Briefcase,
  Gift,
  TrendingUp,
  Code2,
  Building2,
  Home,
  PiggyBank,
  Landmark,
  Coins,
  Users,
  Sparkles,
  Banknote,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  CreditCard,
  Car,
  House,
  Wrench,
  Tv,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { FlowDirection, FlowKind } from "@/types/database";

export type FlowGroupKey =
  | "earned"
  | "passive"
  | "savings"
  | "loans"
  | "insurance"
  | "living"
  | "other";

export type FlowGroup = {
  key: FlowGroupKey;
  label: string;
  hint: string;
};

export const FLOW_GROUPS: Record<FlowGroupKey, FlowGroup> = {
  earned: { key: "earned", label: "Earned income", hint: "Salary, bonus, side work" },
  passive: { key: "passive", label: "Passive income", hint: "Rent, interest, dividends" },
  savings: { key: "savings", label: "Savings & investments", hint: "SIPs, PPF, NPS, stocks" },
  loans: { key: "loans", label: "Loans (EMI)", hint: "Home, car, personal, education" },
  insurance: { key: "insurance", label: "Insurance", hint: "Term, health, mediclaim" },
  living: { key: "living", label: "Rent & living", hint: "Rent, society, utilities" },
  other: { key: "other", label: "Other recurring", hint: "Subscriptions, credit card, fees" },
};

export const INCOME_GROUP_ORDER: FlowGroupKey[] = ["earned", "passive", "other"];
export const OUTCOME_GROUP_ORDER: FlowGroupKey[] = [
  "savings",
  "loans",
  "insurance",
  "living",
  "other",
];

export type FlowPreset = {
  kind: FlowKind;
  direction: FlowDirection;
  group: FlowGroupKey;
  label: string;
  hint: string;
  defaultLabel: string;
  icon: LucideIcon;
  tone: string;
  chip: string;
  starter?: boolean;
};

export const INCOME_PRESETS: FlowPreset[] = [
  {
    kind: "salary",
    direction: "income",
    group: "earned",
    label: "Salary",
    hint: "Monthly take-home",
    defaultLabel: "Salary",
    icon: Briefcase,
    tone: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    starter: true,
  },
  {
    kind: "bonus",
    direction: "income",
    group: "earned",
    label: "Bonus",
    hint: "Annual / variable",
    defaultLabel: "Annual bonus",
    icon: Gift,
    tone: "text-fuchsia-600 dark:text-fuchsia-400",
    chip: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400",
    starter: true,
  },
  {
    kind: "rsu",
    direction: "income",
    group: "earned",
    label: "RSU / ESOP",
    hint: "Stock vesting",
    defaultLabel: "RSU vesting",
    icon: TrendingUp,
    tone: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  },
  {
    kind: "freelance",
    direction: "income",
    group: "earned",
    label: "Freelance",
    hint: "Side gigs, projects",
    defaultLabel: "Freelance",
    icon: Code2,
    tone: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  },
  {
    kind: "consulting",
    direction: "income",
    group: "earned",
    label: "Consulting",
    hint: "Retainers, advisory",
    defaultLabel: "Consulting",
    icon: Building2,
    tone: "text-indigo-600 dark:text-indigo-400",
    chip: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  },
  {
    kind: "rental_income",
    direction: "income",
    group: "passive",
    label: "Rental income",
    hint: "Flat / property rent",
    defaultLabel: "Rental income",
    icon: Home,
    tone: "text-orange-600 dark:text-orange-400",
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  },
  {
    kind: "interest_savings",
    direction: "income",
    group: "passive",
    label: "Savings interest",
    hint: "Bank savings A/C",
    defaultLabel: "Savings interest",
    icon: PiggyBank,
    tone: "text-pink-600 dark:text-pink-400",
    chip: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  },
  {
    kind: "fd_interest",
    direction: "income",
    group: "passive",
    label: "FD interest",
    hint: "Fixed deposit / RD",
    defaultLabel: "FD interest",
    icon: Landmark,
    tone: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  {
    kind: "dividend",
    direction: "income",
    group: "passive",
    label: "Dividend",
    hint: "Stocks, mutual funds",
    defaultLabel: "Dividend",
    icon: Coins,
    tone: "text-yellow-600 dark:text-yellow-400",
    chip: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  },
  {
    kind: "spouse_contribution",
    direction: "income",
    group: "other",
    label: "Spouse / household",
    hint: "Shared household income",
    defaultLabel: "Spouse contribution",
    icon: Users,
    tone: "text-teal-600 dark:text-teal-400",
    chip: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  },
  {
    kind: "other_income",
    direction: "income",
    group: "other",
    label: "Other",
    hint: "Anything else",
    defaultLabel: "Other income",
    icon: Sparkles,
    tone: "text-slate-600 dark:text-slate-400",
    chip: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  },
];

export const OUTCOME_PRESETS: FlowPreset[] = [
  {
    kind: "sip",
    direction: "outcome",
    group: "savings",
    label: "SIP",
    hint: "Mutual fund SIP",
    defaultLabel: "Mutual fund SIP",
    icon: PiggyBank,
    tone: "text-emerald-600 dark:text-emerald-400",
    chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    starter: true,
  },
  {
    kind: "elss",
    direction: "outcome",
    group: "savings",
    label: "ELSS",
    hint: "Tax-saving SIP",
    defaultLabel: "ELSS",
    icon: TrendingUp,
    tone: "text-green-600 dark:text-green-400",
    chip: "bg-green-500/15 text-green-700 dark:text-green-400",
  },
  {
    kind: "ppf",
    direction: "outcome",
    group: "savings",
    label: "PPF",
    hint: "Public Provident Fund",
    defaultLabel: "PPF",
    icon: Landmark,
    tone: "text-lime-600 dark:text-lime-400",
    chip: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
  },
  {
    kind: "nps",
    direction: "outcome",
    group: "savings",
    label: "NPS",
    hint: "National Pension",
    defaultLabel: "NPS",
    icon: Banknote,
    tone: "text-teal-600 dark:text-teal-400",
    chip: "bg-teal-500/15 text-teal-700 dark:text-teal-400",
  },
  {
    kind: "epf_voluntary",
    direction: "outcome",
    group: "savings",
    label: "VPF",
    hint: "Voluntary EPF top-up",
    defaultLabel: "VPF top-up",
    icon: Briefcase,
    tone: "text-cyan-600 dark:text-cyan-400",
    chip: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  },
  {
    kind: "rd",
    direction: "outcome",
    group: "savings",
    label: "RD",
    hint: "Recurring deposit",
    defaultLabel: "Recurring deposit",
    icon: Coins,
    tone: "text-yellow-600 dark:text-yellow-400",
    chip: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  },
  {
    kind: "stocks",
    direction: "outcome",
    group: "savings",
    label: "Stocks",
    hint: "DIY equity investing",
    defaultLabel: "Stocks",
    icon: TrendingUp,
    tone: "text-blue-600 dark:text-blue-400",
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  {
    kind: "home_loan",
    direction: "outcome",
    group: "loans",
    label: "Home loan EMI",
    hint: "Housing loan",
    defaultLabel: "Home loan EMI",
    icon: House,
    tone: "text-orange-600 dark:text-orange-400",
    chip: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
    starter: true,
  },
  {
    kind: "car_loan",
    direction: "outcome",
    group: "loans",
    label: "Car loan EMI",
    hint: "Auto loan",
    defaultLabel: "Car loan EMI",
    icon: Car,
    tone: "text-red-600 dark:text-red-400",
    chip: "bg-red-500/15 text-red-700 dark:text-red-400",
  },
  {
    kind: "personal_loan",
    direction: "outcome",
    group: "loans",
    label: "Personal loan",
    hint: "Unsecured EMI",
    defaultLabel: "Personal loan EMI",
    icon: CreditCard,
    tone: "text-rose-600 dark:text-rose-400",
    chip: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  },
  {
    kind: "education_loan",
    direction: "outcome",
    group: "loans",
    label: "Education loan",
    hint: "Student loan EMI",
    defaultLabel: "Education loan EMI",
    icon: GraduationCap,
    tone: "text-pink-600 dark:text-pink-400",
    chip: "bg-pink-500/15 text-pink-700 dark:text-pink-400",
  },
  {
    kind: "term_insurance",
    direction: "outcome",
    group: "insurance",
    label: "Term insurance",
    hint: "Life cover premium",
    defaultLabel: "Term insurance",
    icon: ShieldCheck,
    tone: "text-indigo-600 dark:text-indigo-400",
    chip: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
    starter: true,
  },
  {
    kind: "health_insurance",
    direction: "outcome",
    group: "insurance",
    label: "Health insurance",
    hint: "Mediclaim premium",
    defaultLabel: "Health insurance",
    icon: HeartPulse,
    tone: "text-fuchsia-600 dark:text-fuchsia-400",
    chip: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400",
    starter: true,
  },
  {
    kind: "rent",
    direction: "outcome",
    group: "living",
    label: "Rent",
    hint: "House rent paid",
    defaultLabel: "House rent",
    icon: Home,
    tone: "text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
    starter: true,
  },
  {
    kind: "society_maintenance",
    direction: "outcome",
    group: "living",
    label: "Society maintenance",
    hint: "Apartment / society",
    defaultLabel: "Society maintenance",
    icon: Wrench,
    tone: "text-amber-600 dark:text-amber-400",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  },
  {
    kind: "utilities",
    direction: "outcome",
    group: "living",
    label: "Utilities",
    hint: "Wifi / mobile / electricity",
    defaultLabel: "Utilities",
    icon: Zap,
    tone: "text-yellow-600 dark:text-yellow-400",
    chip: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  },
  {
    kind: "subscription",
    direction: "outcome",
    group: "other",
    label: "Subscriptions",
    hint: "Netflix, Spotify, gym…",
    defaultLabel: "Subscriptions",
    icon: Tv,
    tone: "text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    starter: true,
  },
  {
    kind: "credit_card",
    direction: "outcome",
    group: "other",
    label: "Credit card",
    hint: "Recurring CC payment",
    defaultLabel: "Credit card",
    icon: CreditCard,
    tone: "text-purple-600 dark:text-purple-400",
    chip: "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  },
  {
    kind: "school_fees",
    direction: "outcome",
    group: "other",
    label: "School fees",
    hint: "Children's school / tuition",
    defaultLabel: "School fees",
    icon: GraduationCap,
    tone: "text-blue-600 dark:text-blue-400",
    chip: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  },
  {
    kind: "other_outcome",
    direction: "outcome",
    group: "other",
    label: "Other",
    hint: "Anything else recurring",
    defaultLabel: "Other outcome",
    icon: Sparkles,
    tone: "text-slate-600 dark:text-slate-400",
    chip: "bg-slate-500/15 text-slate-700 dark:text-slate-400",
  },
];

const ALL_PRESETS = [...INCOME_PRESETS, ...OUTCOME_PRESETS];
const presetByKind = new Map(ALL_PRESETS.map((p) => [p.kind, p]));

export function presetFor(kind: FlowKind): FlowPreset {
  return presetByKind.get(kind) ?? ALL_PRESETS[ALL_PRESETS.length - 1];
}

export function presetsFor(direction: FlowDirection): FlowPreset[] {
  return direction === "income" ? INCOME_PRESETS : OUTCOME_PRESETS;
}

export function groupOrderFor(direction: FlowDirection): FlowGroupKey[] {
  return direction === "income" ? INCOME_GROUP_ORDER : OUTCOME_GROUP_ORDER;
}

export function presetsByGroup(direction: FlowDirection) {
  const order = groupOrderFor(direction);
  const result = new Map<FlowGroupKey, FlowPreset[]>();
  for (const g of order) result.set(g, []);
  for (const p of presetsFor(direction)) {
    const arr = result.get(p.group);
    if (arr) arr.push(p);
  }
  return order.map((g) => ({ group: FLOW_GROUPS[g], presets: result.get(g) ?? [] }));
}
