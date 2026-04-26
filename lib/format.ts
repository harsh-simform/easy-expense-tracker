const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrFormatterWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(n: number, opts?: { paise?: boolean }) {
  if (!Number.isFinite(n)) return "₹0";
  return opts?.paise ? inrFormatterWithPaise.format(n) : inrFormatter.format(n);
}

export function formatCompactINR(n: number) {
  if (!Number.isFinite(n)) return "₹0";
  if (Math.abs(n) >= 1_00_000) {
    return `₹${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 1)}L`;
  }
  if (Math.abs(n) >= 1_000) {
    return `₹${(n / 1_000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  }
  return inrFormatter.format(n);
}

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfMonthISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function startOfYearISO(date = new Date()) {
  return `${date.getFullYear()}-01-01`;
}

export function endOfMonthISO(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

export function dayOfMonth(date = new Date()) {
  return date.getDate();
}
