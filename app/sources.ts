import type {MarketProvider, RawQuote, SourceResult} from "./types";

const endpoints = {
  ngxEquities: "https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=300&pageNo=0",
  ngxTicker: "https://doclib.ngxgroup.com/REST/api/statistics/ticker?$filter=TickerType%20eq%20%27EQUITIES%27&page_size=1000&page_no=0",
  ngxChart: (id: string) => `https://doclib.ngxgroup.com/REST/api/stockchartdata/${encodeURIComponent(id)}`,
  afx: "https://afx.kwayisi.org/ngx/",
  yahoo: (symbol: string) => `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol.endsWith(".LG") ? symbol : `${symbol}.LG`)}`
};

async function get(url: string, ms = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {accept: "application/json,text/html"},
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error(`Timeout after ${ms}ms`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(String(value).replace(/[,₦N\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseJson(text: string): any {
  try { return JSON.parse(text); } catch { return null; }
}

function rows(value: any): any[] {
  if (Array.isArray(value)) return value;
  for (const key of ["data", "items", "results", "value", "records"]) {
    if (Array.isArray(value?.[key])) return value[key];
  }
  return [];
}

const ngxEquities: MarketProvider = {
  name: "NGX Equities Statistics",
  family: "NGX",
  async fetchQuotes() {
    const parsed = parseJson(await get(endpoints.ngxEquities));
    return rows(parsed).map((r: any) => ({
      symbol: String(r.symbol ?? r.Symbol ?? r.ticker ?? r.Ticker ?? "").trim().toUpperCase(),
      name: r.name ?? r.Name ?? r.companyName ?? r.CompanyName,
      price: num(r.close ?? r.Close ?? r.lastPrice ?? r.LastPrice ?? r.price ?? r.Price),
      currency: "NGN",
      asOf: new Date().toISOString(),
      source: "NGX Equities Statistics",
      family: "NGX",
      securityId: r.id ?? r.ID ?? r.securityId ?? r.SecurityId ?? null
    })).filter((q: RawQuote) => q.symbol);
  }
};

const ngxTicker: MarketProvider = {
  name: "NGX Ticker",
  family: "NGX",
  async fetchQuotes() {
    const parsed = parseJson(await get(endpoints.ngxTicker));
    return rows(parsed).map((r: any) => ({
      symbol: String(r.Ticker ?? r.ticker ?? r.Symbol ?? r.symbol ?? "").trim().toUpperCase(),
      name: r.Name ?? r.name ?? r.SecurityName,
      price: num(r.Price ?? r.price ?? r.LastPrice ?? r.lastPrice ?? r.Close ?? r.close),
      currency: "NGN",
      asOf: new Date().toISOString(),
      source: "NGX Ticker",
      family: "NGX",
      securityId: r.ID ?? r.id ?? r.SecurityId ?? null
    })).filter((q: RawQuote) => q.symbol);
  }
};

const afx: MarketProvider = {
  name: "AFX Kwayisi NGX Live",
  family: "AFX",
  async fetchQuotes() {
    // AFX is HTML, not a guaranteed JSON contract. Keep parsing deliberately conservative.
    const html = await get(endpoints.afx);
    const out: RawQuote[] = [];
    const re = /\b([A-Z]{2,8})\b[^\n]{0,80}?([0-9]+(?:\.[0-9]+)?)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(html))) {
      const price = num(match[2]);
      if (price !== null) out.push({
        symbol: match[1], price, currency: "NGN", asOf: new Date().toISOString(),
        source: "AFX Kwayisi NGX Live", family: "AFX"
      });
    }
    return out;
  }
};

function yahooProvider(symbols: string[]): MarketProvider {
  return {
    name: "Yahoo Finance NGX",
    family: "YAHOO",
    async fetchQuotes() {
      const unique = [...new Set(symbols.map(s => s.trim().toUpperCase()).filter(Boolean))];
      const out: RawQuote[] = [];
      // Small concurrency prevents one large NGX refresh from creating an uncontrolled request burst.
      for (let i = 0; i < unique.length; i += 8) {
        const batch = unique.slice(i, i + 8);
        const results = await Promise.all(batch.map(async symbol => {
          try {
            const parsed = parseJson(await get(endpoints.yahoo(symbol)));
            const result = parsed?.chart?.result?.[0];
            const price = num(result?.meta?.regularMarketPrice);
            const timestamp = result?.meta?.regularMarketTime
              ? new Date(result.meta.regularMarketTime * 1000).toISOString()
              : new Date().toISOString();
            return {symbol, price, currency: "NGN" as const, asOf: timestamp, source: "Yahoo Finance NGX", family: "YAHOO" as const};
          } catch {
            return {symbol, price: null, currency: "NGN" as const, asOf: new Date().toISOString(), source: "Yahoo Finance NGX", family: "YAHOO" as const};
          }
        }));
        out.push(...results);
      }
      return out;
    }
  };
}

async function runProvider(provider: MarketProvider, symbols: string[]): Promise<SourceResult> {
  try {
    const quotes = await provider.fetchQuotes(symbols);
    return {source: provider.name, family: provider.family, ok: quotes.length > 0, quotes, fetchedAt: new Date().toISOString(), ...(quotes.length ? {} : {error: "No records returned"})};
  } catch (error) {
    return {source: provider.name, family: provider.family, ok: false, quotes: [], error: String((error as Error)?.message ?? error), fetchedAt: new Date().toISOString()};
  }
}

export async function fetchAll(symbols: string[] = []): Promise<SourceResult[]> {
  // NGX Equities is the canonical discovery source. We fetch it first so Yahoo and chart data
  // can cover the same validated security universe even when the caller supplies no symbols.
  const official = await runProvider(ngxEquities, symbols);
  const discoveredSymbols = [...new Set([
    ...official.quotes.map(q => q.symbol),
    ...symbols.map(s => s.trim().toUpperCase()).filter(Boolean)
  ])];

  const other = await Promise.all([
    runProvider(ngxTicker, discoveredSymbols),
    runProvider(afx, discoveredSymbols),
    runProvider(yahooProvider(discoveredSymbols), discoveredSymbols)
  ]);

  const ids = new Map<string, string>();
  for (const quote of official.quotes) if (quote.securityId) ids.set(quote.symbol, quote.securityId);

  const chartQuotes: RawQuote[] = [];
  const chartErrors: string[] = [];
  for (const [symbol, id] of ids) {
    try {
      const parsed = parseJson(await get(endpoints.ngxChart(id)));
      for (const row of rows(parsed)) {
        const price = num(row.close ?? row.Close ?? row.price ?? row.Price ?? row.y ?? row.value);
        if (price !== null) {
          const date = row.date ?? row.Date ?? row.timestamp ?? row.Timestamp;
          const parsedDate = date ? new Date(date) : new Date();
          chartQuotes.push({
            symbol, price, currency: "NGN",
            asOf: Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString(),
            source: "NGX Stock Chart Data", family: "NGX", securityId: id
          });
        }
      }
    } catch (error) {
      chartErrors.push(`${symbol}: ${String((error as Error)?.message ?? error)}`);
    }
  }

  return [
    official,
    ...other,
    {
      source: "NGX Stock Chart Data",
      family: "NGX",
      ok: chartQuotes.length > 0,
      quotes: chartQuotes,
      ...(chartQuotes.length ? {} : {error: chartErrors[0] || "No chart records returned"}),
      fetchedAt: new Date().toISOString()
    }
  ];
}

export {endpoints, ngxEquities, ngxTicker, afx, yahooProvider};
