"use client";

import { useState } from "react";
import { useActivateAccount } from "../hooks/use-activate-account";
import { useLanguage } from "@/modules/i18n/language-provider";

interface ActivateAccountFormProps {
  token: string | null;
}

export function ActivateAccountForm({ token }: ActivateAccountFormProps) {
  const { t, translateMessage } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { activateAccount, loading, error, success } = useActivateAccount();
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!token) {
      setValidationError(t("activationTokenMissing"));
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(t("passwordsDoNotMatch"));
      return;
    }

    if (password.length < 8) {
      setValidationError(t("passwordMinimum"));
      return;
    }

    await activateAccount(token, password);
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-5 text-green-800">
        {t("accountActivated")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          {t("newPassword")}
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">
          {t("confirmPassword")}
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
        />
      </div>

      {(error || validationError) && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {validationError || translateMessage(error ?? "")}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? t("activating") : t("activate")}
      </button>
    </form>
  );
}
