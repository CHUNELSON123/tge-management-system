import { createMembershipApplicationRouter } from "./presentation/controllers/membership-application.controller.js";
import { createAuthRouter } from "./presentation/controllers/auth.controller.js";
import { createAccountRouter } from "./presentation/controllers/account.controller.js";
import { CreateMembershipApplicationUseCase } from "./application/use-cases/create-membership-application.usecase.js";
import { ActivateAccountUseCase } from "./application/use-cases/activate-account.usecase.js";
import { CreateAccountActivationTokenUseCase } from "./application/use-cases/create-account-activation-token.usecase.js";
import { CreateAccountUseCase } from "./application/use-cases/create-account.usecase.js";
import { ResendAccountInvitationUseCase } from "./application/use-cases/resend-account-invitation.usecase.js";
import { LoginUseCase } from "./application/use-cases/login.usecase.js";
import { PrismaMembershipApplicationRepository } from "./infrastructure/repositories/prisma-membership-application.repository.js";
import { PrismaAccountActivationTokenRepository } from "./infrastructure/repositories/prisma-account-activation-token.repository.js";
import { PrismaUserRepository } from "./infrastructure/repositories/prisma-user.repository.js";
import { JwtService } from "../../common/services/jwt.service.js";
import { EmailService } from "../../common/services/email.service.js";

const membershipApplicationRepository = new PrismaMembershipApplicationRepository();
const activationTokenRepository = new PrismaAccountActivationTokenRepository();
const userRepository = new PrismaUserRepository();
const jwtService = new JwtService();
const emailService = new EmailService();

const createMembershipApplicationUseCase = new CreateMembershipApplicationUseCase(membershipApplicationRepository);
const activateAccountUseCase = new ActivateAccountUseCase(activationTokenRepository);
const createActivationTokenUseCase = new CreateAccountActivationTokenUseCase(activationTokenRepository);
const createAccountUseCase = new CreateAccountUseCase(userRepository, createActivationTokenUseCase, emailService);
const resendAccountInvitationUseCase = new ResendAccountInvitationUseCase(userRepository, createActivationTokenUseCase, emailService);
const loginUseCase = new LoginUseCase(userRepository, jwtService);

export const authModule = createMembershipApplicationRouter(createMembershipApplicationUseCase, activateAccountUseCase);
export const authRouter = createAuthRouter(loginUseCase);
export const accountRouter = createAccountRouter(createAccountUseCase, resendAccountInvitationUseCase);
