export type VerificationSignals={amountMatches:boolean;planMatches:boolean;referencePresent:boolean;duplicateRisk:boolean;manipulationRisk:boolean};
export function verificationDecision(s:VerificationSignals){
 const risk = s.duplicateRisk || s.manipulationRisk;
 return {risk, recommendation:risk?"FLAG":"REVIEW", canAutoApprove:false};
}
