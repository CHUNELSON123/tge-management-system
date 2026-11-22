import type { LucideIcon } from "lucide-react";

export function AdminDashboardPanel({
  title,
  subtitle,
  children,
  className = "",
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-[#E4EBE6] bg-white p-4 shadow-[0_1px_3px_#0b3d2510] sm:p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-[#17211B]">{Icon && <Icon aria-hidden="true" size={18} className="shrink-0 text-[#087542]" />}<span className="min-w-0 break-words">{title}</span></h2>
        {subtitle && <p className="mt-1 text-xs leading-5 text-[#65736A]">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
