"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const inputClass = "mt-1.5 h-11 w-full rounded-md border border-[#DCE2DF] px-3 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15";

export default function FirstAdminSetupPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (password !== data.get("confirmPassword")) { setError("Passwords do not match."); return; }
    if (new TextEncoder().encode(password).length > 72) { setError("Your password must be no more than 72 UTF-8 bytes."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/auth/first-admin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName: data.get("firstName"), lastName: data.get("lastName"), email: data.get("email"), password, setupKey: data.get("setupKey") }),
      });
      const result = await response.json().catch(() => null) as { message?: string } | null;
      if (!response.ok) { setError(result?.message || "Unable to create the administrator account."); return; }
      form.reset();
      setSuccess(true);
    } catch { setError("Unable to connect to the server. Please try again."); }
    finally { setLoading(false); }
  }

  return <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
    <section className="w-full rounded-2xl border border-[#E1E9E3] bg-white p-6 shadow-[0_12px_36px_#06271c18] sm:p-10">
      <div className="flex items-center gap-3 text-[#006B3B]"><ShieldCheck aria-hidden="true" size={28}/><span className="font-bold">TGE administrator setup</span></div>
      <h1 className="mt-6 text-2xl font-bold text-[#17211B]">Create the first administrator</h1>
      <p className="mt-2 text-sm leading-6 text-[#65736A]">This one-time setup creates the system administrator. You will need the private setup key provided by the person configuring the server.</p>
      {success ? <div role="status" className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">Your account has been created. <Link className="font-semibold underline" href="/admin/login">Sign in to the administrator portal</Link>.</div> :
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">First name<input className={inputClass} name="firstName" autoComplete="given-name" maxLength={100} required /></label>
          <label className="text-sm font-semibold">Last name<input className={inputClass} name="lastName" autoComplete="family-name" maxLength={100} required /></label>
        </div>
        <label className="block text-sm font-semibold">Email address<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={255} required /></label>
        <label className="block text-sm font-semibold">Password<input className={inputClass} name="password" type="password" autoComplete="new-password" minLength={8} required /><span className="mt-1 block text-xs font-normal text-[#65736A]">At least 8 characters, up to 72 UTF-8 bytes.</span></label>
        <label className="block text-sm font-semibold">Confirm password<input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
        <label className="block text-sm font-semibold">Private setup key<input className={inputClass} name="setupKey" type="password" autoComplete="off" maxLength={256} required /></label>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button disabled={loading} className="h-11 w-full rounded-md bg-[#006B3B] text-sm font-bold text-white hover:bg-[#075b36] disabled:opacity-60">{loading ? "Creating account..." : "Create administrator account"}</button>
      </form>}
      <p className="mt-5 text-center text-sm text-[#65736A]"><Link href="/admin/login" className="font-semibold text-[#006B3B] hover:underline">Back to administrator sign in</Link></p>
    </section>
  </main>;
}
