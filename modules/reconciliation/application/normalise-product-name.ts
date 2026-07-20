const substitutions: ReadonlyArray<[RegExp, string]> = [
  [/\bcoca[\s-]*cola\b/g, "cocacola"],
  [/\bfull[\s-]*cream\b/g, "fullcream"],
  [/\blit(?:re|er)s?\b/g, "l"],
  [/\bmillilit(?:re|er)s?\b/g, "ml"],
  [/\bkilograms?\b|\bkgs?\b/g, "kg"],
  [/\bgrams?\b|\bgr\b/g, "g"],
  [/\boriginal taste\b/g, "original"],
  [/\bpet\b/g, ""],
];

export function normaliseProductName(value: string): string {
  let normalised = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const [pattern, replacement] of substitutions) {
    normalised = normalised.replace(pattern, replacement);
  }

  return normalised
    .replace(/(\d)\s+(kg|g|ml|l)\b/g, "$1$2")
    .replace(/\bx\s*(\d+)\b/g, "pack $1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function productNameTokens(value: string): ReadonlySet<string> {
  return new Set(
    normaliseProductName(value)
      .split(" ")
      .filter((token) => token.length > 1 || /^\d/.test(token)),
  );
}

export function tokenSimilarityBasisPoints(left: string, right: string): number {
  const a = productNameTokens(left);
  const b = productNameTokens(right);
  if (a.size === 0 || b.size === 0) return 0;

  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  const jaccard = intersection / union;
  const containment = intersection / Math.min(a.size, b.size);
  return Math.round((jaccard * 0.55 + containment * 0.45) * 10_000);
}
