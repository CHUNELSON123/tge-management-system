
"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { authService, AuthRequestError } from "../services/auth.service";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);

  // Next.js Activity preserves page state while hiding it. A previous success
  // must not redirect again when logout brings the login page back into view.
  useLayoutEffect(() => () => {
    setLoginSuccessful(false);
    setRestoringSession(true);
  }, []);

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
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof AuthRequestError && error.status === 401) {
          localStorage.removeItem("tge.accessToken");
          sessionStorage.removeItem("tge.accessToken");
        } else {
          setError(error instanceof Error ? error.message : "Unable to verify your session.");
        }
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
      // Confirm the protected API accepts the token before reporting success
      // or navigating; otherwise login and the portal can redirect in a loop.
      await authService.getSession(result.data.accessToken);
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
