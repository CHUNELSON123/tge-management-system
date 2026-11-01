
"use client";

import { useEffect, useState } from "react";
import { authService } from "../services/auth.service";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const accessToken = localStorage.getItem("tge.accessToken") ??
      sessionStorage.getItem("tge.accessToken");

    if (!accessToken) {
      Promise.resolve().then(() => { if (!cancelled) setRestoringSession(false); });
      return;
    }

    authService.getSession(accessToken)
      .then(() => { if (!cancelled) setLoginSuccessful(true); })
      .catch(() => {
        localStorage.removeItem("tge.accessToken");
        sessionStorage.removeItem("tge.accessToken");
        if (!cancelled) setLoginSuccessful(false);
      })
      .finally(() => { if (!cancelled) setRestoringSession(false); });

    return () => { cancelled = true; };
  }, []);

  async function login(email: string, password: string, remember = false) {
    setLoading(true);
    setError(null);
    setLoginSuccessful(false);

    try {
      const result = await authService.login({ email, password });
      if (remember) {
        localStorage.setItem("tge.accessToken", result.data.accessToken);
        sessionStorage.removeItem("tge.accessToken");
      } else {
        sessionStorage.setItem("tge.accessToken", result.data.accessToken);
        localStorage.removeItem("tge.accessToken");
      }
      setLoginSuccessful(true);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed.",
      );
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    const accessToken = localStorage.getItem("tge.accessToken") ??
      sessionStorage.getItem("tge.accessToken");
    try {
      if (accessToken) await authService.logout(accessToken);
    } finally {
      localStorage.removeItem("tge.accessToken");
      sessionStorage.removeItem("tge.accessToken");
      setLoginSuccessful(false);
    }
  }

  return { login, logout, loading, error, loginSuccessful, restoringSession };
}
