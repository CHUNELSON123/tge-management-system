"use client";

import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import { useAdminLogin } from "../hooks/use-admin-login";

export function AdminLoginForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { busy, message, submitLogin } = useAdminLogin();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitLogin(email, password, remember);
  }

  return <form onSubmit={submit} noValidate className="space-y-4">
    <div><label htmlFor="admin-login-email" className="mb-1.5 block text-sm font-semibold">{t("emailAddress")}</label><div className="relative"><Mail aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727A76]" /><input id="admin-login-email" name="email" type="email" autoComplete="username" maxLength={255} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("enterEmail")} className="h-11 w-full rounded-md border border-[#DCE2DF] pl-10 pr-3 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15" /></div></div>
    <div><label htmlFor="admin-login-password" className="mb-1.5 block text-sm font-semibold">{t("password")}</label><div className="relative"><LockKeyhole aria-hidden="true" size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727A76]" /><input id="admin-login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("enterPassword")} className="h-11 w-full rounded-md border border-[#DCE2DF] pl-10 pr-12 text-sm outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={t(showPassword ? "hidePassword" : "showPassword")} className="absolute right-3 top-1/2 grid h-10 w-8 -translate-y-1/2 place-items-center rounded text-[#727A76] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A]">{showPassword ? <EyeOff aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}</button></div></div>
    <label className="flex w-fit items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-[#087542]" />{t("rememberMe")}</label>
    {message && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <button type="submit" disabled={busy} className="flex min-h-11 w-full items-center justify-center rounded-md bg-[#006B3B] px-5 text-sm font-bold text-white hover:bg-[#075C32] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147E4A] focus-visible:ring-offset-2">{busy ? t("signingIn") : t("adminLoginButton")}</button>
  </form>;
}
