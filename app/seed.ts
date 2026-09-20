import {PrismaClient} from "@prisma/client";
const db=new PrismaClient();
async function main(){
 const rows=[
  ["GTCO","Guaranty Trust Holding Company Plc"],
  ["VITAFOAM","Vitafoam Nigeria Plc"]
 ];
 for(const [symbol,name] of rows) await db.security.upsert({where:{symbol},update:{name},create:{symbol,name}});
}
main().finally(()=>db.$disconnect());
