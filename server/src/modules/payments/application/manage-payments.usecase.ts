import type { ChargeInput, FeeInput, ManualPaymentInput, PaymentsRepository, SimulatedPaymentInput } from "../domain/payments.repository.js";
export class ManagePaymentsUseCase {
  constructor(private readonly repository: PaymentsRepository) {}
  options() { return this.repository.options(); }
  fees() { return this.repository.listFees(); }
  saveFee(id: string | null, input: FeeInput, actorId: string) { return this.repository.saveFee(id, input, actorId); }
  charges(memberId?: string) { return this.repository.listCharges(memberId); }
  own(userId: string) { return this.repository.listOwn(userId); }
  createCharge(input: ChargeInput, actorId: string) { return this.repository.createCharge(input, actorId); }
  manual(input: ManualPaymentInput, actorId: string) { return this.repository.recordManual(input, actorId); }
  voidManual(id: string, reason: string, actorId: string) { return this.repository.voidManual(id, reason, actorId); }
  simulate(input: SimulatedPaymentInput, userId: string) { return this.repository.simulate(input, userId); }
}
