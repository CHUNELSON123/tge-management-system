"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/modules/auth/services/auth.service";
import { useLanguage } from "@/modules/i18n/language-provider";

export default function ChangePasswordPage(){
  const { t, translateMessage } = useLanguage();
  const [currentPassword,setCurrentPassword]=useState("");const [newPassword,setNewPassword]=useState("");const [feedback,setFeedback]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setError("");setFeedback("");const token=localStorage.getItem("tge.accessToken")??sessionStorage.getItem("tge.accessToken");if(!token){setError(t("signInRequiredToChange"));setLoading(false);return;}try{const result=await authService.changePassword(token,{currentPassword,newPassword});setFeedback(translateMessage(result.message));setCurrentPassword("");setNewPassword("");}catch(e){setError(translateMessage(e instanceof Error?e.message:"Unable to change the password."));}finally{setLoading(false);}}
  return <main className="mx-auto mt-12 max-w-md rounded-xl border p-7 shadow"><h1 className="text-2xl font-bold">{t("changePassword")}</h1><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium">{t("currentPassword")}<input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} className="mt-1 h-11 w-full rounded border px-3"/></label><label className="block text-sm font-medium">{t("newPassword")}<input required minLength={8} maxLength={128} type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className="mt-1 h-11 w-full rounded border px-3"/></label>{(feedback||error)&&<p role={error?"alert":"status"} className="text-sm">{feedback||error}</p>}<button disabled={loading} className="w-full rounded bg-[#0D6339] py-3 font-semibold text-white">{loading?t("saving"):t("changePassword")}</button></form><Link href="/portal" className="mt-5 inline-block text-sm text-[#0D6339]">{t("returnToPortal")}</Link></main>;
}
