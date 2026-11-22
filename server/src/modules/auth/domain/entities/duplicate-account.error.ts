export class DuplicateAccountError extends Error {
  constructor(email: string) {
    super(`An account with email ${email} already exists.`);
    this.name = "DuplicateAccountError";
  }
}
