import type {
  ActivateAccountRequest,
  AuthApiResponse,
} from "../types/auth.types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const authService = {
  async activateAccount(
    payload: ActivateAccountRequest,
  ): Promise<AuthApiResponse> {
    const response = await fetch(
      `${API_URL}/api/membership-applications/activate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const data: AuthApiResponse = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Account activation failed.");
    }

    return data;
  },
};