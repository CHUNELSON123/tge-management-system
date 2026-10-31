import { Resend } from "resend";

export class EmailService {
  private readonly resend: Resend;
  private readonly sender: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.EMAIL_FROM;

    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not configured.");
    }

    if (!sender) {
      throw new Error("EMAIL_FROM is not configured.");
    }

    this.resend = new Resend(apiKey);
    this.sender = sender;
  }

  async sendEmail(input: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.sender,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }
}