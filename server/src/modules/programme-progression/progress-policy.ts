export interface RequirementItem { id: string; title: string }
export interface ProgressPolicy { id: string; version: number; attendanceMinimum: number | null; deliverables: unknown }
export interface ProgressRecord { attendanceAttended: number | null; attendanceTotal: number | null; completedDeliverables: unknown; approvedPolicyKey: string | null }

export function policyKey(policy: ProgressPolicy | null, scope: "cohort" | "programme" | null, cohortRevision = 0) {
  return policy && scope ? `${scope}:${policy.id}:${policy.version}:${cohortRevision}` : null;
}

export function requirements(policy: ProgressPolicy | null): RequirementItem[] {
  if (!policy || !Array.isArray(policy.deliverables)) return [];
  return policy.deliverables.filter((item): item is RequirementItem => !!item && typeof item === "object" && typeof item.id === "string" && typeof item.title === "string");
}

export function assessProgress(policy: ProgressPolicy | null, scope: "cohort" | "programme" | null, progress: ProgressRecord | null, cohortRevision = 0) {
  const items = requirements(policy);
  const completed = Array.isArray(progress?.completedDeliverables) ? progress.completedDeliverables.filter((item): item is string => typeof item === "string") : [];
  const attended = progress?.attendanceAttended ?? null;
  const total = progress?.attendanceTotal ?? null;
  const attendanceMet = policy?.attendanceMinimum == null || (attended !== null && total !== null && total > 0 && attended * 100 >= policy.attendanceMinimum * total);
  const completedCount = items.filter((item) => completed.includes(item.id)).length;
  const deliverablesMet = completedCount === items.length;
  const key = policyKey(policy, scope, cohortRevision);
  return { configured: !!policy, scope, attendanceMinimum: policy?.attendanceMinimum ?? null, attendanceAttended: attended, attendanceTotal: total, deliverables: items.map((item) => ({ ...item, completed: completed.includes(item.id) })), requirementsMet: !!policy && attendanceMet && deliverablesMet, attendanceMet, deliverablesMet, approvalCurrent: key !== null && progress?.approvedPolicyKey === key, policyKey: key };
}
