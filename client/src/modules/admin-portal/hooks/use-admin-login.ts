"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/modules/auth/services/auth.service";
import { validateLoginInput } from "@/modules/auth/utils/validate-login";
import { useLanguage } from "@/modules/i18n/language-provider";
import { adminAccessService } from "../services/admin-access.service";

function currentToken() {
  return localStorage.getItem("tge.accessToken") ?? sessionStorage.getItem("tge.accessToken");
}

function clearToken() {
  localStorage.removeItem("tge.accessToken");
  sessionStorage.removeItem("tge.accessToken");
}

export function useAdminLogin() {
  const { t, translateMessage } = useLanguage();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = currentToken();
    if (!token) return;
    const controller = new AbortController();
    adminAccessService.getAccess(token, controller.signal).then((access) => {
      if (access.permissions.includes("reports.view")) router.replace("/admin");
      else setMessage(t("adminLoginRequired"));
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
      if (status === 401) clearToken();
      else if (status === 403) setMessage(t("adminLoginRequired"));
      else setMessage(translateMessage(error instanceof Error ? error.message : t("loginFailed")));
    });
    return () => controller.abort();
  }, [router, t, translateMessage]);

  async function submitLogin(email: string, password: string, remember: boolean) {
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    const validationError = validateLoginInput(normalizedEmail, password);
    if (validationError) { setMessage(translateMessage(validationError)); return; }

    setBusy(true);
    const previousLocalToken = localStorage.getItem("tge.accessToken");
    const previousSessionToken = sessionStorage.getItem("tge.accessToken");
    let issuedToken: string | null = null;
    try {
      const result = await authService.login({ email: normalizedEmail, password });
      issuedToken = result.data.accessToken;
      if (remember) {
        localStorage.setItem("tge.accessToken", issuedToken);
        sessionStorage.removeItem("tge.accessToken");
      } else {
        sessionStorage.setItem("tge.accessToken", issuedToken);
        localStorage.removeItem("tge.accessToken");
      }
      const access = await adminAccessService.getAccess(issuedToken);
      if (!access.permissions.includes("reports.view")) {
        throw Object.assign(new Error("Administrator dashboard permission is required."), { status: 403 });
      }
      router.replace("/admin");
    } catch (error) {
      if (issuedToken) {
        clearToken();
        if (previousLocalToken) localStorage.setItem("tge.accessToken", previousLocalToken);
        if (previousSessionToken) sessionStorage.setItem("tge.accessToken", previousSessionToken);
      }
      const status = typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
      setMessage(status === 403 ? t("adminLoginRequired") : translateMessage(error instanceof Error ? error.message : t("loginFailed")));
    } finally {
      setBusy(false);
    }
  }

  return { busy, message, submitLogin };
}
