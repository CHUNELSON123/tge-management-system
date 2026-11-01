"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useLogin } from "../hooks/use-login";
import { validateLoginInput } from "../utils/validate-login";

export function LoginForm() {
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [remember,setRemember]=useState(false);
  const [showPassword,setShowPassword]=useState(false);
  const [validationError,setValidationError]=useState<string|null>(null);
  const {login,loading,error,loginSuccessful,restoringSession}=useLogin();

  useEffect(()=>{if(loginSuccessful)router.replace("/portal");},[loginSuccessful,router]);

  async function handleSubmit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault(); setValidationError(null);
    const normalized=email.trim().toLowerCase();
    const validation=validateLoginInput(normalized,password);
    if(validation){setValidationError(validation);return;}
    await login(normalized,password,remember);
  }

  return <form onSubmit={handleSubmit} noValidate className="space-y-4">
    <div><label htmlFor="email" className="mb-1.5 block text-xs font-semibold">Email Address</label><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727A76]"/><input id="email" name="email" type="email" autoComplete="email" maxLength={255} value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address" aria-invalid={Boolean(validationError)} className="h-[39px] w-full rounded-md border border-[#DCE2DF] pl-9 pr-3 text-xs outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15"/></div></div>
    <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor="password" className="text-xs font-semibold">Password</label><Link href="/forgot-password" className="text-[11px] font-semibold text-[#006B3B]">Forgot Password?</Link></div><div className="relative"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727A76]"/><input id="password" name="password" type={showPassword?"text":"password"} autoComplete="current-password" maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-[39px] w-full rounded-md border border-[#DCE2DF] pl-9 pr-10 text-xs outline-none focus:border-[#147E4A] focus:ring-2 focus:ring-[#147E4A]/15"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#727A76]">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
    <label className="flex w-fit items-center gap-2 text-[11px]"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-3.5 w-3.5 accent-[#087542]"/>Remember me</label>
    {(validationError||error)&&<p role="alert" className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">{validationError||error}</p>}
    <button type="submit" disabled={loading||restoringSession} className="flex h-[41px] w-full items-center justify-center gap-3 rounded-md bg-gradient-to-r from-[#00673A] to-[#006B3B] text-xs font-bold text-white transition hover:from-[#0D6339] disabled:cursor-wait disabled:opacity-60">{restoringSession?"Restoring session…":loading?"Signing in…":loginSuccessful?"Signed In":"Sign In"}<ArrowRight size={17}/></button>
    {loginSuccessful&&<p role="status" className="text-center text-xs font-medium text-[#0D6339]">You are signed in successfully.</p>}
    <div className="flex items-center gap-3 text-[11px] text-[#727A76]"><span className="h-px flex-1 bg-[#E7EBE9]"/>Or continue with<span className="h-px flex-1 bg-[#E7EBE9]"/></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{["Google","Facebook","Apple"].map(provider=><button key={provider} type="button" disabled className="h-9 rounded-md border border-[#E0E5E2] text-[11px] font-semibold text-[#1C1C1A] disabled:cursor-not-allowed">{provider==="Google"?"🌐":provider==="Facebook"?"🔵":"●"}　{provider}</button>)}</div>
    <p className="text-[10px] leading-5 text-[#3F4542]">By signing in, you agree to our <Link href="/terms" className="font-medium text-[#006B3B]">Terms of Use</Link> and <Link href="/privacy" className="font-medium text-[#006B3B]">Privacy Policy</Link>.</p>
  </form>;
}
