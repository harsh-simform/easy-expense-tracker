import { type NextRequest, NextResponse } from "next/server";
import { getTransactionsInRange } from "@/lib/queries";
import { startOfMonthISO, endOfMonthISO } from "@/lib/format";

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const from = sp.get("from") ?? startOfMonthISO();
  const to = sp.get("to") ?? endOfMonthISO();
  const categoryIds = sp.getAll("categoryId");

  const rows = await getTransactionsInRange(from, to, categoryIds);

  const header = ["Date", "Amount", "Category", "Description"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [
        csvEscape(r.occurred_on),
        csvEscape(Number(r.amount).toFixed(2)),
        csvEscape(r.category?.name ?? ""),
        csvEscape(r.description ?? ""),
      ].join(","),
    ),
  ];
  const csv = lines.join("\n") + "\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expenses_${from}_${to}.csv"`,
    },
  });
}
