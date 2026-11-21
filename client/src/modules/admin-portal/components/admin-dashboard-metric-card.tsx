import type { LucideIcon } from "lucide-react";

export function AdminDashboardMetricCard({
  label,
  value,
  icon: Icon,
  accent,
  className = "",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: string;
  className?: string;
}) {
  return (
    <article className={`flex min-h-24 min-w-0 items-center gap-3 rounded-xl border border-[#E4EBE6] bg-white p-3 shadow-[0_1px_3px_#0b3d2510] sm:min-h-28 sm:p-4 ${className}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${accent}`}>
        <Icon aria-hidden="true" size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none text-[#17211B] sm:text-2xl">{value}</p>
        <p className="mt-2 text-xs font-semibold leading-4 text-[#52645A]">{label}</p>
      </div>
    </article>
  );
}
