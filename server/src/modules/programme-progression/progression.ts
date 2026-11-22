export const FOUNDATION_CODE = "TGE-FOUNDATION";
export const SECOND_STAGE_CODES = ["TGE-YOUNG-ENTREPRENEUR", "TGE-THE-ENTREPRENEUR"] as const;
export const MENTORING_CODE = "TGE-PERSONALIZED-SUPPORT";

export type ProgressionEnrollment = {
  status: string;
  enrolledAt: Date;
  completedAt: Date | null;
  progress?: ProgressRecord | null;
  cohort: { progressRevision?: number; progressPolicy?: ProgressPolicy | null; programme: { code: string | null; progressPolicy?: ProgressPolicy | null } };
};

export const progressionSelect = {
  status: true,
  enrolledAt: true,
  completedAt: true,
  progress: { select: { attendanceAttended: true, attendanceTotal: true, completedDeliverables: true, approvedPolicyKey: true } },
  cohort: { select: { progressRevision: true, progressPolicy: true, programme: { select: { code: true, progressPolicy: true } } } },
} as const;

export function isCurrentCompletion(item: ProgressionEnrollment) {
  if (item.status !== "completed" || !item.completedAt || item.completedAt < item.enrolledAt) return false;
  const policy = item.cohort.progressPolicy ?? item.cohort.programme.progressPolicy ?? null;
  if (!policy) return (item.cohort.progressRevision ?? 0) === 0 && !item.progress?.approvedPolicyKey;
  const assessment = assessProgress(policy, item.cohort.progressPolicy ? "cohort" : "programme", item.progress ?? null, item.cohort.progressRevision);
  return assessment.requirementsMet && assessment.approvalCurrent;
}

export function progressionFor(enrollments: ProgressionEnrollment[]) {
  const completed = enrollments.filter(isCurrentCompletion);
  const foundation = completed.filter((item) => item.cohort.programme.code === FOUNDATION_CODE);
  const secondStage = completed.some((item) =>
    SECOND_STAGE_CODES.some((code) => code === item.cohort.programme.code) &&
    foundation.some((base) => base.completedAt! <= item.enrolledAt),
  );
  return { foundationComplete: foundation.length > 0, secondStageComplete: secondStage };
}

export function enrollmentBlock(code: string | null, progress: ReturnType<typeof progressionFor>): "FOUNDATION_REQUIRED" | "SECOND_STAGE_REQUIRED" | null {
  if (code === FOUNDATION_CODE) return null;
  if (!progress.foundationComplete) return "FOUNDATION_REQUIRED";
  if (code === MENTORING_CODE && !progress.secondStageComplete) return "SECOND_STAGE_REQUIRED";
  return null;
}
import { assessProgress, type ProgressPolicy, type ProgressRecord } from "./progress-policy.js";
