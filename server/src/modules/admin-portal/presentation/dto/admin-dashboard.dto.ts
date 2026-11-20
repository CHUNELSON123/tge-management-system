import { z } from "zod";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
});

export const adminDashboardQuerySchema = z.object({ from: dateOnly, to: dateOnly }).strict().refine(({ from, to }) => {
  const fromTime = Date.parse(`${from}T00:00:00.000Z`);
  const toTime = Date.parse(`${to}T00:00:00.000Z`);
  return toTime >= fromTime && toTime - fromTime <= 365 * 86_400_000;
});

export type AdminDashboardQueryDto = z.infer<typeof adminDashboardQuerySchema>;
