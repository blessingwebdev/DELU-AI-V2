export type MarketSourceFamily = "NGX" | "AFX" | "YAHOO";
export type RawQuote = { symbol:string; name?:string; price:number|null; currency:"NGN"; asOf:string; source:string; family:MarketSourceFamily; securityId?:string|null };
export type ValidatedQuote = RawQuote & { valid:boolean; freshnessSeconds:number; error?:string };
export type SourceResult = {source:string; family:MarketSourceFamily; ok:boolean; quotes:RawQuote[]; error?:string; fetchedAt:string};
export type Verification = {symbol:string; price:number|null; confidence:"VERY_HIGH"|"HIGH"|"CONFIRMED"|"DISCREPANCY"|"UNVERIFIED"|"UNAVAILABLE"; agreeingSources:string[]; families:string[]; values:number[]; checkedAt:string; reason:string};
export type MarketSnapshot = {quotes:ValidatedQuote[]; verifications:Verification[]; sourceResults:SourceResult[]; marketStatus:"OPEN"|"CLOSED"|"WEEKEND"|"HOLIDAY"|"UNKNOWN"; syncedAt:string};
export interface MarketProvider { name:string; family:MarketSourceFamily; fetchQuotes(symbols?:string[]):Promise<RawQuote[]>; }
