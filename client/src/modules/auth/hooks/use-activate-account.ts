"use client";

import { useState } from "react";
import { authService } from "../services/auth.service";

export function useActivateAccount() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function activateAccount(token: string, password: string) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await authService.activateAccount({ token, password });
      setSuccess(true);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account activation failed.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { activateAccount, loading, error, success };
}
