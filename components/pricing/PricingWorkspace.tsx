"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  HelpCircle,
  Award,
  BookOpen,
  MessageSquare,
  Lock,
  ChevronDown,
  Flame,
  Star,
  Users,
} from "lucide-react";
import CheckoutModal from "@/components/course/CheckoutModal";

interface PricingWorkspaceProps {
  currentTier?: "free" | "pro" | "premium" | null;
  userEmail?: string | null;
  userName?: string | null;
}

export default function PricingWorkspace({
  currentTier = "free",
  userEmail,
  userName,
}: PricingWorkspaceProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Modal checkout state
  const [checkoutPlan, setCheckoutPlan] = useState<{
    code: "pro" | "premium";
    title: string;
    price: number;
  } | null>(null);

  const plans = [
    {
      code: "free" as const,
      name: "Free Explorer",
      badge: "Get Started",
      description: "Essential access for curious learners starting their journey.",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        "Access to all free preview lessons",
        "Public community discussions & forum",
        "Standard lesson quizzes & self-checks",
        "Basic progress tracking dashboard",
        "Mobile & desktop web access",
      ],
      notIncluded: [
        "Unlimited premium video courses",
        "Real-time AI Tutor on lesson workspace",
        "Official verified completion certificates",
        "Direct 1-on-1 instructor priority Q&A",
      ],
      ctaText: currentTier === "free" ? "Current Plan" : "Downgrade",
      isPopular: false,
    },
    {
      code: "pro" as const,
      name: "AURA Pro",
      badge: "Most Popular",
      description: "Complete unrestricted access to master modern tech stacks.",
      priceMonthly: 499,
      priceYearly: 4990,
      savingsNote: "Save ₹998 (2 Months Free)",
      features: [
        "Unlimited access to ALL premium video courses",
        "Real-Time AI Tutor on every lesson workspace",
        "Official Verified Completion Certificates with QR codes",
        "Weekly Leaderboard XP & Pro Champion Badge",
        "Interactive programming quiz assessments",
        "Priority community badge & highlights",
        "30-day money-back guarantee",
      ],
      notIncluded: [
        "1-on-1 instructor code review & feedback",
        "Unlimited AI Quiz Generator for educators",
      ],
      ctaText: currentTier === "pro" ? "Active Subscription" : "Upgrade to Pro",
      isPopular: true,
    },
    {
      code: "premium" as const,
      name: "Pro Creator",
      badge: "Ultimate Mastery",
      description: "For serious professionals, creators, and educators seeking 1-on-1 support.",
      priceMonthly: 999,
      priceYearly: 9990,
      savingsNote: "Save ₹1,998 (2 Months Free)",
      features: [
        "Everything included in AURA Pro",
        "Direct 1-on-1 instructor priority feedback & review",
        "Downloadable complete project source code repositories",
        "Unlimited AI Quiz Generator for course creators",
        "Offline video lessons & project resources",
        "Early access to newly released masterclasses",
        "VIP certificate verification page for LinkedIn & resumes",
      ],
      notIncluded: [],
      ctaText: currentTier === "premium" ? "Active Subscription" : "Get Pro Creator",
      isPopular: false,
    },
  ];

  const faqs = [
    {
      q: "Which payment methods are supported via Razorpay?",
      a: "We support all major Indian and international payment methods through Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards (Visa, Mastercard, RuPay), NetBanking across 50+ banks, EMI, and popular digital wallets.",
    },
    {
      q: "Can I cancel or change my subscription at any time?",
      a: "Yes, you can cancel your membership anytime in one click from Settings > Subscription & Billing. You will retain full access until the end of your prepaid billing period with zero cancellation fees.",
    },
    {
      q: "How does certificate verification work for employers?",
      a: "Every verified certificate issued by AURA features a unique cryptographic identifier and a dedicated public verification URL (e.g. /course/[id]/certificate). Recruiters and employers can instantly verify the authenticity and completion date.",
    },
    {
      q: "Can I claim GST input tax credit for business expenses?",
      a: "Yes! Every successful transaction generates an official tax invoice with GST breakdown and receipt sent directly to your registered email address.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer an unconditional 30-day money-back guarantee on all Pro and Premium plans. If you are not satisfied with your learning progress, simply contact support for a prompt refund.",
    },
  ];

  const handleSelectPlan = (plan: {
    code: "pro" | "premium";
    name: string;
    priceMonthly: number;
    priceYearly: number;
  }) => {
    const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
    setCheckoutPlan({
      code: plan.code,
      title: `${plan.name} (${billingCycle === "monthly" ? "Monthly" : "Annual"})`,
      price,
    });
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute left-1/3 bottom-0 h-[600px] w-[600px] rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
        {/* ── Top Header ────────────────────────────────────────────────────────── */}
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-300 backdrop-blur-md shadow-lg shadow-violet-500/10">
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>Transparent, High-ROI Learning Memberships</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Invest in your skills. <br />
            <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              Accelerate your engineering career.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Get unlimited access to real-world courses, live AI tutoring on every lesson, verified completion credentials, and instructor guidance.
          </p>

          {/* ── Billing Cycle Toggle ─────────────────────────────────────────── */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="inline-flex items-center rounded-2xl border border-white/10 bg-zinc-900/80 p-1.5 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`rounded-xl px-5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === "yearly"
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <span>Annual Billing</span>
                <span className="rounded-full bg-emerald-400/20 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Plan Cards Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          {plans.map((plan) => {
            const price = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
            const period = billingCycle === "monthly" ? "/mo" : "/yr";
            const isCurrent = currentTier === plan.code;

            return (
              <div
                key={plan.code}
                className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 ${
                  plan.isPopular
                    ? "border-2 border-violet-500/60 bg-gradient-to-b from-violet-950/40 via-zinc-900/90 to-zinc-950/90 shadow-2xl shadow-violet-500/20 scale-[1.02] md:-translate-y-2"
                    : "border border-white/10 bg-zinc-900/60 hover:border-white/20 shadow-xl"
                }`}
              >
                {/* Popular highlight pill */}
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-violet-500 px-4 py-1 text-[11px] font-black text-zinc-950 uppercase tracking-wider shadow-lg">
                      <Flame className="h-3.5 w-3.5 fill-zinc-950" /> {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Title & Badge */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <p className="mt-1 text-xs text-zinc-400 min-h-[32px]">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-6 pb-6 border-b border-white/5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-white">
                        {price === 0 ? "₹0" : `₹${price.toLocaleString("en-IN")}`}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">{period}</span>
                    </div>

                    {billingCycle === "yearly" && plan.savingsNote && (
                      <p className="mt-1.5 text-[11px] font-bold text-emerald-400">
                        {plan.savingsNote}
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="mt-6 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      What&apos;s Included:
                    </p>
                    <ul className="space-y-2.5">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-300">
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {plan.notIncluded.length > 0 && (
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        {plan.notIncluded.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-xs text-zinc-500 line-through">
                            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-600">
                              <span className="h-1 w-1 rounded-full bg-zinc-600" />
                            </div>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Call to action button */}
                <div className="mt-8 pt-4">
                  {plan.code === "free" ? (
                    <Link
                      href="/dashboard"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                      <span>{plan.ctaText}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectPlan(plan as any)}
                      disabled={isCurrent}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition cursor-pointer shadow-lg ${
                        plan.isPopular
                          ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-400 text-white hover:brightness-110 shadow-violet-600/30"
                          : "bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/10"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <Zap className="h-4 w-4" />
                      <span>{plan.ctaText}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Feature Comparison Matrix ────────────────────────────────────────── */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-10 backdrop-blur-2xl space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-white">Compare All Features</h2>
            <p className="text-xs text-zinc-400">
              Detailed breakdown of feature access across all membership tiers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Feature Category</th>
                  <th className="py-3 px-4 text-center">Free Explorer</th>
                  <th className="py-3 px-4 text-center text-violet-300 font-bold">AURA Pro</th>
                  <th className="py-3 px-4 text-center text-amber-300 font-bold">Pro Creator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Course Video Catalog</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">Preview lessons</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Unlimited All</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Unlimited All</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Interactive Lesson AI Tutor</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">5 questions / day</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Unlimited Instant</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Unlimited Instant</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Verified Certificates</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">&mdash;</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Included + QR</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">VIP Credential</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Weekly XP Leaderboard Boost</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">Standard XP</td>
                  <td className="py-3.5 px-4 text-center text-violet-300 font-bold">Pro Badge + 1.5x</td>
                  <td className="py-3.5 px-4 text-center text-amber-300 font-bold">Creator Badge + 2x</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Instructor 1-on-1 Q&A</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">Public forum</td>
                  <td className="py-3.5 px-4 text-center text-zinc-400">Public forum</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Direct Priority</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Project Source Code Repositories</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">&mdash;</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">&mdash;</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Downloadable Code</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">AI Quiz Generator for Teachers</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">&mdash;</td>
                  <td className="py-3.5 px-4 text-center text-zinc-500">&mdash;</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">Unlimited</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Trust & Security Badging ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">256-Bit SSL Encryption</h4>
            <p className="text-xs text-zinc-400">Processed securely via Razorpay with timing-safe HMAC checks.</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Instant UPI & Cards</h4>
            <p className="text-xs text-zinc-400">Zero surcharge across Google Pay, PhonePe, Cards, and NetBanking.</p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">30-Day Money-Back Guarantee</h4>
            <p className="text-xs text-zinc-400">Risk-free enrollment with no-questions-asked refund policy.</p>
          </div>
        </div>

        {/* ── FAQ Accordion ────────────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto space-y-6 pt-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">Frequently Asked Questions</h2>
            <p className="text-xs text-zinc-400">Everything you need to know about billing and payments.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/10 bg-zinc-900/60 overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-bold text-white hover:text-cyan-300 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform ${
                      activeFaq === idx ? "rotate-180 text-cyan-300" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Enterprise / Institutional Banner ────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-violet-900/30 via-indigo-900/20 to-zinc-900 p-8 sm:p-10 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl text-center md:text-left">
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-300">
                Institutional & Teams
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Upskill your entire university batch or engineering team
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Need bulk seat licenses, consolidated invoicing, customized LMS reporting, and dedicated mentorship?
              </p>
            </div>

            <a
              href="mailto:partnerships@aura-lms.com?subject=AURA%20Enterprise%20Team%20Inquiry"
              className="rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-zinc-950 transition hover:bg-zinc-200 shadow-xl whitespace-nowrap"
            >
              Contact Enterprise Sales
            </a>
          </div>
        </div>
      </div>

      {/* ── Razorpay Checkout Modal ────────────────────────────────────────── */}
      {checkoutPlan && (
        <CheckoutModal
          isOpen={Boolean(checkoutPlan)}
          onClose={() => setCheckoutPlan(null)}
          onSuccess={() => {
            setCheckoutPlan(null);
            window.location.href = "/dashboard";
          }}
          title={checkoutPlan.title}
          price={checkoutPlan.price}
          planCode={checkoutPlan.code}
          billingCycle={billingCycle}
        />
      )}
    </div>
  );
}
