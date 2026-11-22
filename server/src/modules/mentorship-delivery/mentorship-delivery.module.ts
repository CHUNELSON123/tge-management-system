import { ManageMentorshipDelivery } from "./application/manage-mentorship-delivery.usecase.js";
import { PrismaMentorshipDeliveryRepository } from "./infrastructure/prisma-mentorship-delivery.repository.js";
import { createMentorshipDeliveryRouter } from "./presentation/mentorship-delivery.controller.js";
const delivery = new ManageMentorshipDelivery(new PrismaMentorshipDeliveryRepository());
export const mentorshipDeliveryRouters = { admin: createMentorshipDeliveryRouter(delivery, "admin"), mentor: createMentorshipDeliveryRouter(delivery, "mentor"), member: createMentorshipDeliveryRouter(delivery, "member") };
