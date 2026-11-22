export function validateLoginInput(email: string, password: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 255) {
    return "Please enter a valid email address.";
  }
  if (!password || password.length > 128) return "Please enter your password.";
  return null;
}
