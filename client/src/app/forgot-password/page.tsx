"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/modules/auth/services/auth.service";

export default function ForgotPasswordPage() {
  const [email,setEmail]=useState(""); const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setError("");setMessage("");try{const result=await authService.requestPasswordRecovery({email});setMessage(result.message);}catch(e){setError(e instanceof Error?e.message:"Unable to process the request.");}finally{setLoading(false);}}
  return <main className="mx-auto mt-20 max-w-md rounded-xl border p-7 shadow"><h1 className="text-2xl font-bold">Forgot Password?</h1><p className="mt-2 text-sm text-gray-600">Enter your registered email to request password reset instructions.</p><form onSubmit={submit} className="mt-5 space-y-4"><label className="block text-sm font-medium">Email address<input required type="email" maxLength={255} value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 h-11 w-full rounded border px-3"/></label>{(message||error)&&<p role={error?"alert":"status"} className="text-sm">{message||error}</p>}<button disabled={loading} className="w-full rounded bg-[#0D6339] py-3 font-semibold text-white">{loading?"Sending…":"Send reset instructions"}</button></form><Link href="/login" className="mt-5 inline-block text-sm text-[#0D6339]">Return to sign in</Link></main>;
}
