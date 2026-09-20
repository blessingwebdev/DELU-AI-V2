export type Role="USER"|"PRO"|"ADMIN"|"OWNER";
export function can(role:Role,action:string){if(action.startsWith("admin:"))return role==="ADMIN"||role==="OWNER";if(action.startsWith("owner:"))return role==="OWNER";return true}
