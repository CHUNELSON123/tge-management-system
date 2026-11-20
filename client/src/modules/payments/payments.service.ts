export type Currency = "USD" | "CAD" | "EUR" | "GBP";
export type FeeInput = { name: string; category: "membership" | "programme" | "event"; audience: "member" | "guest" | "all"; amountMinor: number; currency: Currency; programmeId: string | null; eventId: string | null; active: boolean };
export type Fee = FeeInput & { id: string; programme: { name: string } | null; event: { title: string } | null };
export type Payment = { id: string; kind: "manual" | "simulation"; status: string; amountMinor: number; currency: Currency; method: string; reference: string; paidAt: string; voidedAt: string | null; voidReason: string | null; voidedBy: { id: string; firstName: string; lastName: string } | null; recordedBy: { id: string; firstName: string; lastName: string } | null };
export type Charge = { id: string; feeName: string; amountMinor: number; currency: Currency; periodKey: string; dueDate: string | null; payerName: string; payerEmail: string; memberId: string | null; paidMinor: number; outstandingMinor: number; paymentStatus: "free" | "unpaid" | "partial" | "paid"; payments: Payment[] };
export type Options = { members: Array<{ id: string; name: string; email: string }>; programmes: Array<{ id: string; name: string }>; events: Array<{ id: string; title: string }> };
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export function sessionToken() { return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken") ?? ""; }
export function amountToMinor(value: string) { if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) throw new Error("Enter a valid amount with up to two decimal places."); const [whole, fraction = ""] = value.trim().split("."); const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0")); if (!Number.isSafeInteger(amount) || amount > 100000000) throw new Error("Amount is too large."); return amount; }
export function money(amount: number, currency: string, locale = "en") { return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-US", { style: "currency", currency }).format(amount / 100); }
export function paymentLabel(value: string, fr: boolean) { if (!fr) return value.replaceAll("_", " "); const labels: Record<string, string> = { free: "gratuit", unpaid: "impayé", partial: "partiel", paid: "payé", confirmed: "confirmé", success: "réussi", pending: "en attente", failed: "échoué", member: "membres", guest: "non-membres", all: "tous", cash: "espèces", bank_transfer: "virement", other: "autre", simulated_card: "carte simulée" }; return labels[value] ?? value; }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> { const response = await fetch(`${API}${path}`, { ...options, cache: "no-store", headers: { Authorization: `Bearer ${sessionToken()}`, ...(options.body ? { "Content-Type": "application/json" } : {}) } }); const body = await response.json().catch(() => null) as { data?: T; message?: string } | null; if (!response.ok || body?.data === undefined) throw new Error(body?.message ?? "Payments are temporarily unavailable."); return body.data; }
export const paymentsService = {
  fees: () => request<Fee[]>("/api/admin/payments/fees"),
  options: () => request<Options>("/api/admin/payments/options"),
  charges: () => request<Charge[]>("/api/admin/payments/charges"),
  saveFee: (id: string | null, value: FeeInput) => request<Fee>(id ? `/api/admin/payments/fees/${id}` : "/api/admin/payments/fees", { method: id ? "PUT" : "POST", body: JSON.stringify(value) }),
  createCharge: (value: object) => request<Charge>("/api/admin/payments/charges", { method: "POST", body: JSON.stringify(value) }),
  manual: (value: object) => request<Charge>("/api/admin/payments/manual", { method: "POST", body: JSON.stringify(value) }),
  voidManual: (id: string, reason: string) => request<Charge>(`/api/admin/payments/manual/${id}/void`, { method: "POST", body: JSON.stringify({ reason }) }),
  own: () => request<Charge[]>("/api/member/payments/charges"),
  simulate: (value: object) => request<Charge>("/api/member/payments/simulate", { method: "POST", body: JSON.stringify(value) }),
};
