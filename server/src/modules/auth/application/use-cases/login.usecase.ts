import bcrypt from "bcrypt";
import type { UserRepository } from "../../domain/repositories/user.repository.js";
import type { JwtService } from "../../../../common/services/jwt.service.js";

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: {
    email: string;
    password: string;
  }): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findByEmail(
      input.email.trim().toLowerCase(),
    );

    if (!user || user.status !== "ACTIVE" || user.deletedAt !== null) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return {
      accessToken: this.jwtService.signAccessToken(user.id),
    };
  }
}
