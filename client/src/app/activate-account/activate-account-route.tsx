"use client";

import { useSearchParams } from "next/navigation";
import { ActivateAccountForm } from "@/modules/auth/components/activate-account-form";

export function ActivateAccountRoute() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-5 py-12">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Activate your TGE account
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a password to complete your account activation.
        </p>
        <ActivateAccountForm token={token} />
      </section>
    </main>
  );
}
