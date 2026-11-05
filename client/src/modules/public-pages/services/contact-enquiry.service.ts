export interface ContactEnquiryInput { name: string; email: string; subject: string; message: string; consent: true; }
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
export class ContactEnquiryError extends Error {
  constructor(public readonly kind: "validation" | "rate-limit" | "unavailable") { super(kind); this.name = "ContactEnquiryError"; }
}
export const contactEnquiryService = {
  async submit(input: ContactEnquiryInput): Promise<void> {
    const response = await fetch(`${API_URL}/api/public/contact-enquiries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (response.status === 400) throw new ContactEnquiryError("validation");
    if (response.status === 429) throw new ContactEnquiryError("rate-limit");
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object" || !("data" in body) || !body.data || typeof body.data !== "object" || !("received" in body.data) || body.data.received !== true) throw new ContactEnquiryError("unavailable");
  },
};
