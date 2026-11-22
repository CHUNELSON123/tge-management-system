
import type {
  ActivateAccountRequest,
  AuthApiResponse,
  LoginRequest,
  LoginApiResponse,
  AuthenticatedSessionResponse,
  PasswordRecoveryRequest,
  PasswordResetRequest,
} from "../types/auth.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class AuthRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "AuthRequestError"; }
}

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new AuthRequestError(fallbackMessage, response.status);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !("message" in data) ||
    typeof data.message !== "string"
  ) {
    throw new AuthRequestError(fallbackMessage, response.status);
  }

  if (!response.ok) {
    throw new AuthRequestError(data.message || fallbackMessage, response.status);
  }

  return data as T;
}

export const authService = {
  async activateAccount(
    payload: ActivateAccountRequest,
  ): Promise<AuthApiResponse> {
    const response = await fetch(
      `${API_URL}/api/membership-applications/activate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    return parseResponse<AuthApiResponse>(
      response,
      "Account activation failed.",
    );
  },

  async login(payload: LoginRequest): Promise<LoginApiResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse<LoginApiResponse>(
      response,
      "Login failed. Please try again.",
    );

    if (
      !data.data ||
      typeof data.data.accessToken !== "string" ||
      !data.data.accessToken
    ) {
      throw new Error("The login response was incomplete.");
    }

    return data;
  },

  async getSession(accessToken: string): Promise<AuthenticatedSessionResponse> {
    const response = await fetch(`${API_URL}/api/auth/session`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    return parseResponse<AuthenticatedSessionResponse>(
      response,
      "Your session has expired. Please sign in again.",
    );
  },

  async logout(accessToken: string): Promise<void> {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    await parseResponse<{ message: string }>(response, "Sign out failed.");
  },

  async requestPasswordRecovery(payload: PasswordRecoveryRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/password/recovery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return parseResponse(response, "Unable to process the request.");
  },

  async resetPassword(payload: PasswordResetRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/password/reset`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return parseResponse(response, "Unable to reset the password.");
  },

  async changePassword(accessToken: string, payload: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/auth/password/change`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify(payload) });
    return parseResponse(response, "Unable to change the password.");
  },
};
