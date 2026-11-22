import { prisma } from "../../../infrastructure/database/prisma-client.js";
import type { ChargeInput, FeeInput, ManualPaymentInput, PaymentsRepository, SimulatedPaymentInput } from "../domain/payments.repository.js";

const chargeSelect = { id: true, feeName: true, amountMinor: true, currency: true, periodKey: true, dueDate: true, createdAt: true, memberId: true, guestName: true, guestEmail: true, member: { select: { user: { select: { firstName: true, lastName: true, email: true } } } }, payments: { orderBy: { createdAt: "desc" as const }, select: { id: true, kind: true, status: true, amountMinor: true, currency: true, method: true, reference: true, paidAt: true, createdAt: true, voidedAt: true, voidReason: true, voidedBy: { select: { id: true, firstName: true, lastName: true } }, recordedBy: { select: { id: true, firstName: true, lastName: true } } } } } as const;
type ChargeRow = Awaited<ReturnType<typeof prisma.memberCharge.findFirstOrThrow<{ select: typeof chargeSelect }>>>;
function shape(row: ChargeRow) {
  const paidMinor = row.payments.filter((payment) => payment.kind === "manual" && payment.status === "confirmed" && !payment.voidedAt).reduce((sum, payment) => sum + payment.amountMinor, 0);
  return { ...row, payerName: row.member ? `${row.member.user.firstName} ${row.member.user.lastName}`.trim() : row.guestName, payerEmail: row.member?.user.email ?? row.guestEmail, member: undefined, paidMinor, outstandingMinor: Math.max(0, row.amountMinor - paidMinor), paymentStatus: row.amountMinor === 0 ? "free" : paidMinor === 0 ? "unpaid" : paidMinor < row.amountMinor ? "partial" : "paid" };
}

export class PrismaPaymentsRepository implements PaymentsRepository {
  async options() {
    const [members, programmes, events] = await Promise.all([
      prisma.member.findMany({ where: { user: { deletedAt: null } }, orderBy: { user: { firstName: "asc" } }, select: { id: true, user: { select: { firstName: true, lastName: true, email: true } } } }),
      prisma.programme.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
      prisma.event.findMany({ orderBy: { startAt: "desc" }, select: { id: true, title: true } }),
    ]);
    return { members: members.map((item) => ({ id: item.id, name: `${item.user.firstName} ${item.user.lastName}`.trim(), email: item.user.email })), programmes, events };
  }
  listFees() { return prisma.feeDefinition.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], include: { programme: { select: { name: true } }, event: { select: { title: true } } } }); }
  async saveFee(id: string | null, input: FeeInput, actorId: string) {
    return prisma.$transaction(async (tx) => {
      if (input.programmeId && !await tx.programme.findUnique({ where: { id: input.programmeId }, select: { id: true } })) throw new Error("PROGRAMME_NOT_FOUND");
      if (input.eventId && !await tx.event.findUnique({ where: { id: input.eventId }, select: { id: true } })) throw new Error("EVENT_NOT_FOUND");
      if (id && !await tx.feeDefinition.findUnique({ where: { id }, select: { id: true } })) throw new Error("FEE_NOT_FOUND");
      const fee = id ? await tx.feeDefinition.update({ where: { id }, data: input }) : await tx.feeDefinition.create({ data: input });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: id ? "ADMIN_FEE_UPDATED" : "ADMIN_FEE_CREATED", entityType: "FeeDefinition", entityId: fee.id, details: { name: fee.name, amountMinor: fee.amountMinor, currency: fee.currency, category: fee.category, audience: fee.audience, active: fee.active } } });
      return fee;
    });
  }
  async listCharges(memberId?: string) { return (await prisma.memberCharge.findMany({ where: memberId ? { memberId } : {}, orderBy: { createdAt: "desc" }, select: chargeSelect })).map(shape); }
  async listOwn(userId: string) { return (await prisma.memberCharge.findMany({ where: { member: { userId } }, orderBy: { createdAt: "desc" }, select: chargeSelect })).map(shape); }
  async createCharge(input: ChargeInput, actorId: string) {
    const id = await prisma.$transaction(async (tx) => {
      const fee = await tx.feeDefinition.findUnique({ where: { id: input.feeId } });
      if (!fee || !fee.active) throw new Error("FEE_NOT_ACTIVE");
      if (input.memberId && fee.audience === "guest" || !input.memberId && fee.audience === "member") throw new Error("FEE_AUDIENCE_MISMATCH");
      if (input.memberId && !await tx.member.findFirst({ where: { id: input.memberId, user: { deletedAt: null } }, select: { id: true } })) throw new Error("MEMBER_NOT_FOUND");
      const charge = await tx.memberCharge.create({ data: { feeId: fee.id, memberId: input.memberId, guestName: input.guestName, guestEmail: input.guestEmail?.toLowerCase() ?? null, periodKey: input.periodKey, feeName: fee.name, amountMinor: fee.amountMinor, currency: fee.currency, dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : null, createdByUserId: actorId } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_CHARGE_CREATED", entityType: "MemberCharge", entityId: charge.id, details: { feeId: fee.id, amountMinor: fee.amountMinor, currency: fee.currency, periodKey: input.periodKey } } });
      return charge.id;
    });
    return shape(await prisma.memberCharge.findFirstOrThrow({ where: { id }, select: chargeSelect }));
  }
  async recordManual(input: ManualPaymentInput, actorId: string) {
    const id = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM member_charges WHERE id = ${input.chargeId}::uuid FOR UPDATE`;
      const charge = await tx.memberCharge.findUnique({ where: { id: input.chargeId }, select: { id: true, amountMinor: true, currency: true, payments: { where: { kind: "manual", status: "confirmed", voidedAt: null }, select: { amountMinor: true } } } });
      if (!charge) throw new Error("CHARGE_NOT_FOUND");
      const outstanding = charge.amountMinor - charge.payments.reduce((sum, item) => sum + item.amountMinor, 0);
      if (input.amountMinor > outstanding) throw new Error("PAYMENT_EXCEEDS_BALANCE");
      if (new Date(input.paidAt) > new Date()) throw new Error("PAYMENT_DATE_FUTURE");
      const payment = await tx.paymentRecord.create({ data: { chargeId: charge.id, kind: "manual", status: "confirmed", amountMinor: input.amountMinor, currency: charge.currency, method: input.method, reference: input.reference.trim(), paidAt: new Date(input.paidAt), recordedByUserId: actorId } });
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_MANUAL_PAYMENT_RECORDED", entityType: "PaymentRecord", entityId: payment.id, details: { chargeId: charge.id, amountMinor: payment.amountMinor, currency: payment.currency, method: payment.method, reference: payment.reference } } });
      return charge.id;
    });
    return shape(await prisma.memberCharge.findFirstOrThrow({ where: { id }, select: chargeSelect }));
  }
  async voidManual(id: string, reason: string, actorId: string) {
    const chargeId = await prisma.$transaction(async (tx) => {
      const payment = await tx.paymentRecord.findUnique({ where: { id }, select: { chargeId: true, kind: true } });
      if (!payment || payment.kind !== "manual") throw new Error("PAYMENT_NOT_FOUND");
      await tx.$queryRaw`SELECT id FROM member_charges WHERE id = ${payment.chargeId}::uuid FOR UPDATE`;
      const changed = await tx.paymentRecord.updateMany({ where: { id, voidedAt: null }, data: { voidedAt: new Date(), voidedByUserId: actorId, voidReason: reason } });
      if (changed.count !== 1) throw new Error("PAYMENT_ALREADY_VOIDED");
      await tx.auditLog.create({ data: { actorUserId: actorId, action: "ADMIN_MANUAL_PAYMENT_VOIDED", entityType: "PaymentRecord", entityId: id, details: { chargeId: payment.chargeId, reason } } });
      return payment.chargeId;
    });
    return shape(await prisma.memberCharge.findFirstOrThrow({ where: { id: chargeId }, select: chargeSelect }));
  }
  async simulate(input: SimulatedPaymentInput, userId: string) {
    const id = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM member_charges WHERE id = ${input.chargeId}::uuid FOR UPDATE`;
      const charge = await tx.memberCharge.findFirst({ where: { id: input.chargeId, member: { userId } }, select: { id: true, amountMinor: true, currency: true, payments: { where: { kind: "manual", status: "confirmed", voidedAt: null }, select: { amountMinor: true } } } });
      if (!charge) throw new Error("CHARGE_NOT_FOUND");
      const existing = await tx.paymentRecord.findUnique({ where: { requestKey: input.requestKey } });
      if (existing) { if (existing.chargeId !== charge.id || existing.amountMinor !== input.amountMinor || existing.status !== input.outcome) throw new Error("REQUEST_KEY_CONFLICT"); return charge.id; }
      const outstanding = charge.amountMinor - charge.payments.reduce((sum, item) => sum + item.amountMinor, 0);
      if (input.amountMinor > outstanding) throw new Error("PAYMENT_EXCEEDS_BALANCE");
      await tx.paymentRecord.create({ data: { chargeId: charge.id, kind: "simulation", status: input.outcome, amountMinor: input.amountMinor, currency: charge.currency, method: "simulated_card", reference: `TEST-${input.requestKey}`, paidAt: new Date(), requestKey: input.requestKey } });
      return charge.id;
    });
    return shape(await prisma.memberCharge.findFirstOrThrow({ where: { id }, select: chargeSelect }));
  }
}
