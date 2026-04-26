import type { Category } from "@/types/database";

type Cat = Pick<Category, "id" | "name" | "keywords">;

export function categorize(description: string, categories: Cat[]): string | null {
  if (!description.trim()) return null;
  const haystack = description.toLowerCase();

  for (const cat of categories) {
    for (const kw of cat.keywords ?? []) {
      const k = kw.trim().toLowerCase();
      if (!k) continue;
      if (haystack.includes(k)) return cat.id;
    }
  }
  return null;
}

// Rank categories by how strongly their keywords match the description.
// Returns suggested (any match, best first) and rest (no match, original order).
export function rankCategoriesByMatch<C extends Cat>(
  description: string,
  categories: C[],
): { suggested: C[]; rest: C[] } {
  if (!description.trim()) {
    return { suggested: [], rest: categories };
  }
  const haystack = description.toLowerCase();
  const scored = categories.map((cat) => {
    let score = 0;
    for (const kw of cat.keywords ?? []) {
      const k = kw.trim().toLowerCase();
      if (k && haystack.includes(k)) score++;
    }
    return { cat, score };
  });
  return {
    suggested: scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.cat),
    rest: scored.filter((s) => s.score === 0).map((s) => s.cat),
  };
}
