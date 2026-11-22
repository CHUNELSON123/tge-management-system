import type { LucideIcon } from "lucide-react";
export function Metric({ label, value, icon: Icon, color = "green" }: { label: string; value: number | string; icon: LucideIcon; color?: "green" | "blue" | "purple" | "amber" }) {
  const colors = { green: "bg-[#edf7f1] text-green-700", blue: "bg-[#eef7fd] text-blue-600", purple: "bg-[#f5f0fc] text-purple-700", amber: "bg-[#fff8e9] text-amber-600" };
  return <div className={`flex min-w-0 items-center gap-3 rounded-lg p-3 sm:p-4 ${colors[color]}`}><span className="rounded-lg bg-white/60 p-2"><Icon size={27}/></span><div><strong className="block text-xl font-bold text-slate-950 sm:text-2xl">{value}</strong><span className="text-xs text-slate-700">{label}</span></div></div>;
}
export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) { return <section className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-bold">{title}</h2>{action}</div><div className="mt-2">{children}</div></section>; }
export function Empty({ text }: { text: string }) { return <p className="py-4 text-sm text-slate-600">{text}</p>; }
export const formatDate = (value: string) => new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
