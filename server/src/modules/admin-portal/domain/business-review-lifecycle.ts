import type { BusinessReviewDecision } from "./admin-businesses.repository.js";

export function canReviewBusinessTransition(currentStatus: string, nextStatus: BusinessReviewDecision): boolean {
  return (currentStatus === "pending_review" && (nextStatus === "approved" || nextStatus === "rejected"))
    || (currentStatus === "approved" && nextStatus === "suspended")
    || (currentStatus === "suspended" && nextStatus === "approved");
}
