import type { AdminAccountStatus } from "./admin-users.repository.js";
export function canTransitionAccount(current: AdminAccountStatus, next: "ACTIVE" | "SUSPENDED") {
  return (current === "ACTIVE" && next === "SUSPENDED") || (current === "SUSPENDED" && next === "ACTIVE");
}
