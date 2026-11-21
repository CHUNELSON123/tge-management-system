import { z } from "zod";
const nullableText = (max: number) => z.string().trim().max(max).nullable();
export const mentorProfileUpdateSchema = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), phone: nullableText(30), location: nullableText(255), bio: nullableText(250), expertise: nullableText(5000), professionalBackground: nullableText(10000), availability: nullableText(5000) }).strict();
