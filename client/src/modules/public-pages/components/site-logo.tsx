import Image from "next/image";

interface SiteLogoProps {
  tone?: "light" | "dark";
  priority?: boolean;
}

export function SiteLogo({ tone = "light", priority = false }: SiteLogoProps) {
  const wordmarkColor = tone === "dark" ? "text-white" : "text-[#111B16]";

  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      <span className="relative h-12 w-12 shrink-0 overflow-hidden">
        <Image
          src="/tge-logo.png"
          alt=""
          width={96}
          height={96}
          priority={priority}
          className={`absolute -left-6 -top-4 max-w-none ${tone === "dark" ? "brightness-0 invert" : ""}`}
        />
      </span>
      <span className={`text-[11px] font-extrabold uppercase leading-[1.05] ${wordmarkColor}`}>
        The <span className="text-[#147E4A]">Green</span>
        <br />
        Entrepreneur
      </span>
    </span>
  );
}
