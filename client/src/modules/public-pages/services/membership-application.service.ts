export interface MembershipApplicationInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export class MembershipApplicationRequestError extends Error {
  constructor(public readonly kind: "validation" | "unavailable") {
    super(kind === "validation" ? "Invalid membership application data." : "Membership applications are temporarily unavailable.");
    this.name = "MembershipApplicationRequestError";
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const membershipApplicationService = {
  async submit(input: MembershipApplicationInput): Promise<void> {
    const response = await fetch(`${API_URL}/api/membership-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body: unknown = await response.json().catch(() => null);
    if (response.status === 400) throw new MembershipApplicationRequestError("validation");
    if (!response.ok || !body || typeof body !== "object" || !("data" in body)) {
      throw new MembershipApplicationRequestError("unavailable");
    }
    const data = body.data;
    if (!data || typeof data !== "object" || !("received" in data) || data.received !== true) {
      throw new MembershipApplicationRequestError("unavailable");
    }
  },
};
