import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Network, Store, UsersRound } from "lucide-react";
import { LoginForm } from "@/modules/auth/components/login-form";

const benefits = [
  { icon: UsersRound, title: "Access Exclusive Programmes", text: "Enrol in training, workshops and mentorship programmes designed for entrepreneurs." },
  { icon: CalendarDays, title: "Stay Updated", text: "Get the latest news, events and opportunities in the TGE community." },
  { icon: Store, title: "Grow Your Business", text: "List your business in our directory and connect with potential partners and clients." },
  { icon: Network, title: "Build Connections", text: "Network with like-minded entrepreneurs, mentors and industry experts." },
];

function LoginHeader() {
  return (
    <header className="flex h-[68px] items-center justify-between bg-white px-6 sm:px-10">
      <Link href="/" aria-label="The Green Entrepreneur home">
        <Image src="/tge-logo.png" alt="The Green Entrepreneur" width={180} height={60} priority className="h-auto w-36" />
      </Link>
      <nav className="hidden items-center gap-7 text-xs font-semibold text-[#1C1C1A] lg:flex">
        {["Home", "About Us", "Programmes", "Events", "News", "Business Directory", "Contact Us"].map((label) => (
          <Link key={label} href={label === "Home" ? "/" : `/${label.toLowerCase().replaceAll(" ", "-")}`} className="hover:text-[#147E4A]">{label}</Link>
        ))}
      </nav>
      <Link href="/login" className="rounded-md bg-[#006B3B] px-5 py-2 text-xs font-semibold text-white">♙ &nbsp; Login</Link>
    </header>
  );
}

function LoginFooter() {
  return (
    <footer className="bg-[#07100F] px-7 py-8 text-white sm:px-10">
      <div className="mx-auto grid max-w-7xl gap-7 text-xs sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1"><Image src="/tge-logo.png" alt="The Green Entrepreneur" width={190} height={65} className="h-auto w-40 brightness-0 invert" /><p className="mt-4 leading-6 text-white/80">Empowering entrepreneurs to build sustainable businesses and create positive impact.</p></div>
        <div><h3 className="mb-3 font-bold">Quick Links</h3><p className="space-y-2 leading-6 text-white/80">Home<br/>About Us<br/>Programmes<br/>Events<br/>News<br/>Contact Us</p></div>
        <div><h3 className="mb-3 font-bold">Community</h3><p className="space-y-2 leading-6 text-white/80">Business Directory<br/>Membership<br/>Mentorship<br/>Volunteer<br/>Support TGE</p></div>
        <div><h3 className="mb-3 font-bold">Contact Us</h3><p className="leading-6 text-white/80">Buea, Southwest Region,<br/>Republic of Cameroon<br/>info@tge-cameroon.org<br/>+237 675 123 456<br/>Mon - Fri: 8:00 AM - 5:00 PM<br/>Sat: 9:00 AM - 1:00 PM</p></div>
        <div><h3 className="mb-3 font-bold">Newsletter</h3><p className="leading-5 text-white/80">Subscribe for updates on events and opportunities.</p><div className="mt-3 flex"><input aria-label="Newsletter email" placeholder="Enter your email" className="min-w-0 rounded-l bg-white px-3 py-2 text-[#1C1C1A]"/><button className="rounded-r bg-[#006B3B] px-3 font-semibold">Subscribe</button></div></div>
      </div>
      <div className="mx-auto mt-7 flex max-w-7xl justify-between border-t border-white/20 pt-4 text-[11px] text-white/75"><span>© 2026 The Green Entrepreneur. All rights reserved.</span><span>Privacy Policy　 |　 Terms of Use</span></div>
    </footer>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white text-[#1C1C1A]">
      <LoginHeader />
      <main>
        <section className="relative overflow-hidden bg-[#06271C] text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_50%,#28603b_0%,#06271c_42%,#031a13_76%)]" />
          <div className="relative mx-auto flex min-h-[198px] max-w-7xl items-center px-8 py-8 sm:px-12 lg:min-h-[198px]">
            <div className="max-w-lg"><h1 className="text-3xl font-bold sm:text-[32px]">Welcome Back!</h1><h2 className="mt-1 text-xl font-bold text-[#38B765]">Sign in to your TGE account</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/90">Access your dashboard, manage your activities, and stay connected with the TGE community.</p></div>
            <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 hidden h-full w-[57%] bg-[linear-gradient(90deg,#06271c_0%,transparent_35%),url('/login-hero.png')] bg-cover bg-center lg:block" />
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-7 md:grid-cols-[0.78fr_1.22fr] lg:px-12">
          <aside className="hidden border-r border-[#E2E8E5] pr-8 md:block">
            <h2 className="font-bold">New to TGE?</h2><p className="mt-1 max-w-xs text-xs leading-5">Join our community of entrepreneurs and be part of a movement creating sustainable impact.</p>
            <div className="mt-3 space-y-3">{benefits.map(({icon: Icon,title,text})=><div key={title} className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5EE] text-[#0D6339]"><Icon size={21}/></span><p className="text-[11px] leading-4"><strong className="block text-xs">{title}</strong>{text}</p></div>)}</div>
            <Link href="/signup" className="mt-5 block rounded border border-[#147E4A] px-4 py-2.5 text-center text-xs font-semibold text-[#0D6339]">♙　Create an Account</Link>
          </aside>
          <div className="mx-auto w-full max-w-[600px] rounded-2xl border border-[#F0F1F0] bg-white p-6 shadow-[0_2px_12px_#00000012] sm:p-7"><h2 className="text-xl font-bold">Sign In</h2><p className="mt-1 text-xs text-[#5F6662]">Enter your credentials to access your account</p><div className="mt-4"><LoginForm /></div></div>
          <div className="rounded-xl bg-[#E8F5EE] p-5 md:hidden"><h2 className="font-bold">New to TGE?</h2><p className="mt-1 text-xs">Join our community and unlock opportunities to grow.</p><Link href="/signup" className="mt-4 block rounded border border-[#147E4A] px-4 py-2 text-center text-xs font-semibold text-[#0D6339]">♙　Create an Account</Link></div>
        </section>
      </main>
      <LoginFooter />
    </div>
  );
}
