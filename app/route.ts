import {NextResponse} from "next/server"; import {getMarketHealth} from "@/lib/market/service"; import {proposeEvolution} from "@/lib/evolution/policy"; import {listTickets} from "@/lib/support/service";
export async function GET(){return NextResponse.json({market:await getMarketHealth(),support:listTickets(),evolution:proposeEvolution()})}
