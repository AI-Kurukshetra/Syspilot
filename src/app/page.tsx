import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "SysPilot | AI-Powered ERP for Growing Manufacturers",
  description:
    "Modern ERP for inventory, sales, procurement, production, finance, quality, and forecasting in one platform.",
}

const benefits = [
  {
    title: "One system from quote to cash",
    description:
      "Run inventory, sales, purchasing, production, and finance from one connected workspace with live operational visibility.",
  },
  {
    title: "AI forecasting that reduces stock pressure",
    description:
      "Predict demand with trend-aware forecasting to plan replenishment, reduce shortages, and avoid overstock carrying costs.",
  },
  {
    title: "Role-based controls for secure teams",
    description:
      "Keep each company isolated by subdomain with tenant-safe data access and secure role permissions across operations.",
  },
]

const testimonials = [
  {
    quote:
      "SysPilot gave us real-time control over inventory and production. Our planning meetings went from reactive to proactive.",
    name: "Aarav Patel",
    role: "Operations Director, NovaFab",
  },
  {
    quote:
      "We replaced spreadsheets and disconnected tools. The team now tracks sales, procurement, and fulfillment in one place.",
    name: "Maya Reynolds",
    role: "General Manager, BlueCircuit Components",
  },
  {
    quote:
      "The forecasting and quality modules helped us reduce delays and improve on-time delivery within the first quarter.",
    name: "Daniel Kim",
    role: "Plant Lead, MetroForge",
  },
]

const pricingPlans = [
  {
    name: "Starter",
    price: "$49",
    note: "per company / month",
    features: ["Up to 10 users", "Core ERP modules", "Email support"],
  },
  {
    name: "Growth",
    price: "$149",
    note: "per company / month",
    features: ["Up to 50 users", "AI forecasting", "Priority support"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "annual contract",
    features: ["Unlimited users", "Advanced security", "Dedicated success manager"],
  },
]

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden scroll-smooth">
      <div className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bark-grid opacity-45" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-16 pt-8 md:px-8 md:pt-12">
        <header className="glass-surface bark-shadow animate-fade-rise sticky top-3 z-20 flex items-center justify-between rounded-2xl border border-white/60 px-4 py-3 md:px-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">SysPilot</p>
            <p className="text-xs text-slate-600 md:text-sm">
              AI-powered ERP for manufacturing and distribution teams
            </p>
          </div>
          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
            <Link className="transition hover:text-blue-700" href="#features">
              Features
            </Link>
            <Link className="transition hover:text-blue-700" href="#pricing">
              Pricing
            </Link>
            <Link className="transition hover:text-blue-700" href="#contact">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Register</Link>
            </Button>
          </div>
        </header>

        <section className="grid items-center gap-8 md:grid-cols-2">
          <div className="animate-fade-rise space-y-5">
            <p className="inline-flex rounded-full border border-blue-300/50 bg-blue-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
              Enterprise Operations Reimagined
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Run your entire factory with intelligence, not spreadsheets.
            </h1>
            <p className="max-w-xl text-base text-slate-700 md:text-lg">
              SysPilot unifies inventory, sales, procurement, production, finance, and quality into one
              modern operating system so your team can act faster and with confidence.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="h-11 px-6 text-sm md:text-base">
                <Link href="/signup">Start Free</Link>
              </Button>
              <Button asChild className="h-11 px-6 text-sm md:text-base" variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>

          <div className="animate-float-soft">
            <div className="glass-surface bark-shadow overflow-hidden rounded-3xl border border-white/65 p-3">
              <Image
                alt="SysPilot dashboard preview"
                className="w-full rounded-2xl border border-blue-100/80"
                height={900}
                priority
                src="/screenshots/dashboard-overview.svg"
                width={1440}
              />
            </div>
          </div>
        </section>

        <section className="space-y-5" id="features">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Why teams choose SysPilot</h2>
            <p className="text-slate-700">Purpose-built benefits for operations, finance, and leadership teams.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="glass-surface bark-shadow animate-fade-rise rounded-2xl border border-white/60 p-5"
              >
                <h3 className="text-lg font-semibold text-slate-900">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{benefit.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="glass-surface bark-shadow overflow-hidden rounded-3xl border border-white/65 p-3">
            <Image
              alt="SysPilot modules and operational workflows"
              className="h-full w-full rounded-2xl border border-blue-100/80 object-cover"
              height={800}
              src="/screenshots/operations-modules.svg"
              width={1200}
            />
          </div>
          <div className="glass-surface bark-shadow overflow-hidden rounded-3xl border border-white/65 p-3">
            <Image
              alt="Advanced modules including BOM, quality, and AI forecasting"
              className="h-full w-full rounded-2xl border border-blue-100/80 object-cover"
              height={800}
              src="/screenshots/advanced-modules.svg"
              width={1200}
            />
          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Trusted by modern operations teams</h2>
            <p className="text-slate-700">What current customers say after moving to SysPilot.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="glass-surface bark-shadow rounded-2xl border border-white/60 p-5"
              >
                <p className="text-sm leading-6 text-slate-700">“{item.quote}”</p>
                <div className="mt-4 border-t border-slate-200/70 pt-3">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5" id="pricing">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">Flexible pricing for every stage</h2>
            <p className="text-slate-700">Start small, scale confidently, and upgrade as operations grow.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <article
                key={plan.name}
                className="glass-surface bark-shadow rounded-2xl border border-white/60 p-5"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">{plan.name}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{plan.price}</p>
                <p className="text-xs text-slate-600">{plan.note}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {plan.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-surface bark-shadow rounded-3xl border border-white/60 p-6 text-center md:p-10" id="contact">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Ready to run your company on one operating system?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-700">
            Create your company workspace and get a dedicated subdomain in minutes.
          </p>
          <p className="mx-auto mt-2 text-sm text-slate-600">
            Need enterprise onboarding? Contact us at <span className="font-medium">sales@syspilot.io</span>
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild className="h-11 px-6">
              <Link href="/signup">Create Company Account</Link>
            </Button>
            <Button asChild className="h-11 px-6" variant="outline">
              <Link href="/login">Login to Workspace</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
