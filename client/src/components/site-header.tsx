import Image from "next/image";
import Link from "next/link";

const navigation = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E2E8E5] bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="The Green Entrepreneur home">
          <Image
            src="/tge-logo.png"
            alt="The Green Entrepreneur"
            width={180}
            height={60}
            priority
            className="h-auto w-36 object-contain sm:w-44"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-[#5F6662] transition-colors hover:text-[#147E4A]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#147E4A] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0D6339]"
        >
          Login
        </Link>
      </div>
    </header>
  );
}