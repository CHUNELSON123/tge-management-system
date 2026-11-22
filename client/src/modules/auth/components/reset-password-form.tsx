"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "../services/auth.service";
import { useLanguage } from "@/modules/i18n/language-provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t, translateMessage } = useLanguage();
  const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setError("");setMessage("");try{const result=await authService.resetPassword({token,password});setMessage(translateMessage(result.message));}catch(e){setError(translateMessage(e instanceof Error?e.message:"Unable to reset the password."));}finally{setLoading(false);}}
  return <main className="mx-auto mt-12 max-w-md rounded-xl border p-7 shadow"><h1 className="text-2xl font-bold">{t("resetPassword")}</h1><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium">{t("newPassword")}<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 h-11 w-full rounded border px-3"/></label>{!token&&<p role="alert" className="text-sm text-red-700">{t("resetLinkMissing")}</p>}{(message||error)&&<p role={error?"alert":"status"} className="text-sm">{message||error}</p>}<button disabled={loading||!token} className="w-full rounded bg-[#0D6339] py-3 font-semibold text-white">{loading?t("resetting"):t("resetPassword")}</button></form><Link href="/login" className="mt-5 inline-block text-sm text-[#0D6339]">{t("returnToSignIn")}</Link></main>;
}
