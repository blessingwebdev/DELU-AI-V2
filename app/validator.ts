import type {RawQuote, ValidatedQuote, Verification} from "./types";

export function validateQuote(q: RawQuote, now = new Date()): ValidatedQuote {
  const t = Date.parse(q.asOf);
  const age = Number.isFinite(t) ? Math.max(0, (now.getTime() - t) / 1000) : Infinity;
  if (!q.symbol?.trim()) return {...q, valid: false, freshnessSeconds: age, error: "Missing symbol"};
  if (q.price !== null && (!Number.isFinite(q.price) || q.price < 0)) return {...q, valid: false, freshnessSeconds: age, error: "Invalid price"};
  if (!Number.isFinite(t)) return {...q, valid: false, freshnessSeconds: age, error: "Invalid timestamp"};
  return {...q, valid: true, freshnessSeconds: age};
}

export function verifyQuotes(symbol: string, quotes: RawQuote[], now = new Date()): Verification {
  const valid = quotes.map(q => validateQuote(q, now)).filter(q => q.valid && q.price !== null) as ValidatedQuote[];
  const groups = new Map<number, ValidatedQuote[]>();
  for (const quote of valid) {
    const key = Math.round((quote.price as number) * 100) / 100;
    const group = groups.get(key) || [];
    group.push(quote);
    groups.set(key, group);
  }
  if (!valid.length) return {symbol, price: null, confidence: "UNAVAILABLE", agreeingSources: [], families: [], values: [], checkedAt: now.toISOString(), reason: "No valid source price available."};

  const best = [...groups.values()].sort((a, b) => b.length - a.length)[0];
  const families = [...new Set(best.map(q => q.family))];
  const independent = families.length;
  const confidence = best.length >= 5 && independent >= 2 ? "VERY_HIGH"
    : best.length >= 4 && independent >= 2 ? "HIGH"
    : best.length >= 3 ? "CONFIRMED"
    : best.length >= 2 ? "DISCREPANCY"
    : "UNVERIFIED";

  const price = confidence === "DISCREPANCY" || confidence === "UNVERIFIED" ? null : best[0].price;
  return {
    symbol, price, confidence,
    agreeingSources: best.map(q => q.source),
    families,
    values: valid.map(q => q.price as number),
    checkedAt: now.toISOString(),
    reason: `${best.length} source value(s) agree across ${independent} source family/families.`
  };
}
