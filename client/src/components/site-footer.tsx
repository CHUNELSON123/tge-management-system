import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Our Services", href: "/services" },
  { label: "Contact", href: "/contact" },
];

const communityLinks = [
  { label: "Membership", href: "#" },
  { label: "Events", href: "#" },
  { label: "Resources", href: "#" },
];

export function SiteFooter() {
  return (
    <footer className="bg-[#0D6339] text-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" aria-label="The Green Entrepreneur home">
              <Image
                src="/tge-logo.png"
                alt="The Green Entrepreneur"
                width={180}
                height={60}
                className="h-auto w-40 object-contain"
              />
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-white/75">
              Empowering entrepreneurs and building a community for sustainable
              growth and business development.
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">Community</h3>
            <ul className="space-y-3">
              {communityLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h4 className="mb-3 text-sm font-semibold">Follow Us</h4>
              <div className="flex flex-wrap gap-4 text-sm text-white/75">
                <Link href="#" className="hover:text-white" aria-label="Facebook">
                  Facebook
                </Link>
                <Link href="#" className="hover:text-white" aria-label="Instagram">
                  Instagram
                </Link>
                <Link href="#" className="hover:text-white" aria-label="LinkedIn">
                  LinkedIn
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">Contact Us</h3>
            <ul className="space-y-4 text-sm text-white/75">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Cameroon</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Contact details coming soon</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0" />
                <span>Email details coming soon</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/20 pt-6 text-center">
          <p className="text-sm text-white/65">
            © 2026 The Green Entrepreneur. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}