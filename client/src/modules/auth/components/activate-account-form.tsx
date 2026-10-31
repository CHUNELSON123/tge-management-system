"use client";

import { useState } from "react";
import { useActivateAccount } from "../hooks/use-activate-account";

interface ActivateAccountFormProps {
  token: string | null;
}

export function ActivateAccountForm({ token }: ActivateAccountFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { activateAccount, loading, error, success } = useActivateAccount();
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!token) {
      setValidationError("Your activation link is missing its token.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setValidationError("Password must contain at least 8 characters.");
      return;
    }

    await activateAccount(token, password);
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-5 text-green-800">
        Your TGE account has been activated successfully.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Create password
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
          Confirm password
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
          {validationError || error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !token}
        className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
      >
        {loading ? "Activating..." : "Activate account"}
      </button>
    </form>
  );
}
