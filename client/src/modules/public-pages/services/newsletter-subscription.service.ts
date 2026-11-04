const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export const newsletterSubscriptionService = {
  async subscribe(email: string, source: string): Promise<"subscribed" | "already-subscribed"> {
    const response = await fetch(`${API_URL}/api/public/newsletter-subscriptions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, source }) });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") throw new Error("Newsletter subscription is unavailable.");
    const status = "status" in body ? body.status : undefined;
    if (status !== "subscribed" && status !== "already-subscribed") throw new Error("Newsletter subscription response is invalid.");
    return status;
  },
};
