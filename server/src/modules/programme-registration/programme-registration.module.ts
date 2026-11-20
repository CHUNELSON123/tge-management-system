import { ManageProgrammeRegistration } from "./application/manage-programme-registration.usecase.js";
import { PrismaProgrammeRegistrationRepository } from "./infrastructure/prisma-programme-registration.repository.js";
import { createProgrammeRegistrationRouters } from "./presentation/programme-registration.controller.js";
export const programmeRegistrationRouters = createProgrammeRegistrationRouters(new ManageProgrammeRegistration(new PrismaProgrammeRegistrationRepository()));
