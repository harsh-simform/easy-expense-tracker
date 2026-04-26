export type ParsedInput = {
  amount: number;
  description: string;
};

// Extract the first number (with optional decimal) and treat the rest as the description.
// Examples:
//   "100 petrol"        -> { amount: 100,   description: "petrol" }
//   "lunch 250"         -> { amount: 250,   description: "lunch" }
//   "₹1,200 dinner"     -> { amount: 1200,  description: "dinner" }
//   "12.50 coffee"      -> { amount: 12.5,  description: "coffee" }
//   "500"               -> { amount: 500,   description: "" }
//   "petrol"            -> null
export function parseInput(raw: string): ParsedInput | null {
  const cleaned = raw.replace(/[₹$,]/g, " ").trim();
  if (!cleaned) return null;

  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const description = (cleaned.slice(0, match.index) + cleaned.slice(match.index! + match[0].length))
    .replace(/\s+/g, " ")
    .trim();

  return { amount, description };
}
