import Link from "next/link";
import {
  QrCode,
  ArrowRight,
  MonitorPlay,
  LayoutDashboard,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const NAV_LINKS = [
  { href: "#document", label: "Document" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#support", label: "Support" },
];

const FEATURES = [
  {
    href: "/customer/register",
    icon: Smartphone,
    title: "Customer Portal",
    desc: "Scan, register, and track your queue ticket in real time.",
  },
  {
    href: "/staff/counter",
    icon: LayoutDashboard,
    title: "Staff Counter",
    desc: "Call, recall, skip and complete customer tickets.",
  },
  {
    href: "/tv",
    icon: MonitorPlay,
    title: "TV Display",
    desc: "Now-serving board with chime & voice announcements.",
  },
  {
    href: "/admin",
    icon: ShieldCheck,
    title: "Admin Panel",
    desc: "Manage categories, counters, QR codes & analytics.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] font-sans text-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Navbar */}
        <header className="flex items-center justify-between py-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Smart QR
          </Link>

          <nav className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/70 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="#"
              className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
            >
              Sign up
            </Link>
            <Link
              href="#"
              className="rounded-full border border-violet-500/50 px-5 py-2 text-sm font-semibold text-white transition-colors hover:border-violet-400 hover:bg-white/5"
            >
              Log in
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-16 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="font-sans text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Smart Queue
              <br />
              System
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-white/50">
              A QR code (Quick Response code) is a two-dimensional,
              square-shaped barcode. Originally invented in 1994 by the
              Japanese company Denso Wave.
            </p>

            <div className="mt-10 flex items-center gap-4">
              <Link
                href="/customer/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
              >
                GET START <ArrowRight size={16} />
              </Link>
              <span className="h-3 w-3 rounded-sm bg-white/10" />
            </div>

            <p className="mt-20 text-sm uppercase tracking-[0.2em] text-white/30">
              Description
            </p>
          </div>

          {/* Hero image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="absolute inset-0 -z-10 m-auto h-105 w-105 rounded-full bg-violet-600/30 blur-[100px]" />

            <div className="relative aspect-4/3 w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2">
                <div className="bg-amber-700" />
                <div className="bg-sky-600" />
                <div className="bg-rose-600" />
                <div className="bg-emerald-600" />
                <div className="bg-indigo-700" />
                <div className="bg-orange-500" />
              </div>
              <div className="absolute inset-0 bg-black/35" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-48 w-28 -rotate-6 flex-col items-center justify-center gap-3 rounded-2xl border-4 border-neutral-900 bg-neutral-900 shadow-xl">
                  <div className="rounded-md bg-white p-2">
                    <QrCode className="h-12 w-12 text-black" />
                  </div>
                  <div className="h-1 w-10 rounded-full bg-neutral-700" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16">
          <h2 className="font-sans text-3xl font-bold sm:text-4xl">Features</h2>
          <p className="mt-3 max-w-xl text-white/50">
            Everything you need to run a contactless queue, from customer
            check-in to live staff and TV displays.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/3 p-6 transition-colors hover:border-violet-500/40 hover:bg-white/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600/15 text-violet-400">
                  <item.icon size={22} strokeWidth={2} />
                </div>
                <h3 className="font-sans text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-violet-400">
                  Open <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          id="support"
          className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-10 text-sm text-white/40 sm:flex-row"
        >
          <span>© {new Date().getFullYear()} Smart QR. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#document" className="hover:text-white">
              Document
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#support" className="hover:text-white">
              Support
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
