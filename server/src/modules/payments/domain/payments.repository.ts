export interface FeeInput { name: string; category: "membership" | "programme" | "event"; audience: "member" | "guest" | "all"; amountMinor: number; currency: "USD" | "CAD" | "EUR" | "GBP"; programmeId: string | null; eventId: string | null; active: boolean }
export interface ChargeInput { feeId: string; memberId: string | null; guestName: string | null; guestEmail: string | null; periodKey: string; dueDate: string | null }
export interface ManualPaymentInput { chargeId: string; amountMinor: number; method: "cash" | "bank_transfer" | "other"; reference: string; paidAt: string }
export interface SimulatedPaymentInput { chargeId: string; amountMinor: number; outcome: "success" | "pending" | "failed"; requestKey: string }
export interface PaymentsRepository {
  options(): Promise<unknown>;
  listFees(): Promise<unknown>;
  saveFee(id: string | null, input: FeeInput, actorId: string): Promise<unknown>;
  listCharges(memberId?: string): Promise<unknown>;
  listOwn(userId: string): Promise<unknown>;
  createCharge(input: ChargeInput, actorId: string): Promise<unknown>;
  recordManual(input: ManualPaymentInput, actorId: string): Promise<unknown>;
  voidManual(id: string, reason: string, actorId: string): Promise<unknown>;
  simulate(input: SimulatedPaymentInput, userId: string): Promise<unknown>;
}
