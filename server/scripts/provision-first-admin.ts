import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(currentDirectory, "../.env"),
  override: true,
});

const { prisma } = await import("database");

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_FROM;
  const activationBaseUrl = process.env.ACTIVATION_URL;

  if (!apiKey || !sender || !activationBaseUrl) {
    throw new Error("Missing Resend or activation environment configuration.");
  }

  const readline = createInterface({ input: stdin, output: stdout });

  try {
    const email = (await readline.question("Administrator email: "))
      .trim()
      .toLowerCase();

    const firstName = (await readline.question("First name: ")).trim();
    const lastName = (await readline.question("Last name: ")).trim();

    if (!email || !firstName || !lastName) {
      throw new Error("Email, first name and last name are required.");
    }

    const role = await prisma.role.findUnique({
      where: { name: "System Administrator" },
    });

    if (!role) {
      throw new Error("System Administrator role is missing. Run the role seeder first.");
    }

    const existingAdministrator = await prisma.user.findFirst({
      where: {
        roleId: role.id,
        deletedAt: null,
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingAdministrator && existingAdministrator.email !== email) {
      throw new Error("A System Administrator already exists. Provisioning stopped.");
    }

    if (existingUser && existingUser.roleId !== role.id) {
      throw new Error("This email already belongs to another account.");
    }

    if (existingUser?.status === "ACTIVE") {
      throw new Error("This administrator account is already active.");
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const passwordHash = existingUser?.passwordHash ??
      await bcrypt.hash(randomBytes(32).toString("hex"), 12);

    const user = await prisma.$transaction(async (tx) => {
      let administrator;

      if (existingUser) {
        administrator = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            firstName,
            lastName,
            status: "PENDING_ACTIVATION",
          },
        });
      } else {
        administrator = await tx.user.create({
          data: {
            roleId: role.id,
            email,
            firstName,
            lastName,
            passwordHash,
            status: "PENDING_ACTIVATION",
          },
        });
      }

      await tx.accountActivationToken.updateMany({
        where: {
          userId: administrator.id,
          usedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });

      await tx.accountActivationToken.create({
        data: {
          userId: administrator.id,
          tokenHash,
          expiresAt,
        },
      });

      return administrator;
    });

    const activationUrl = new URL(activationBaseUrl);
    activationUrl.searchParams.set("token", rawToken);

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: sender,
      to: email,
      subject: "Your TGE System Administrator invitation",
      html: `
        <h2>Welcome to TGE, ${firstName}.</h2>
        <p>Your System Administrator account has been provisioned.</p>
        <p>Use the link below to set your password and activate your account.</p>
        <p><a href="${activationUrl.toString()}">Activate administrator account</a></p>
        <p>This link expires in 24 hours and can only be used once.</p>
      `,
    });

    if (error) {
      throw new Error(`Resend delivery failed: ${error.message}. The pending account remains; rerun this script to issue a replacement invitation.`);
    }

    console.log("Administrator invitation sent successfully.");
    console.log("Account status: PENDING_ACTIVATION");
    console.log("User ID:", user.id);
    console.log("Activation token is stored hashed. It will not be displayed.");
  } finally {
    readline.close();
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
