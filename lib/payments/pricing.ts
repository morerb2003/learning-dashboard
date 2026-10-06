/**
 * Authoritative Server-Side Pricing & Financial Mathematics for AURA.
 * All calculations use integer paise (minor units: 100 paise = ₹1.00)
 * to strictly prevent floating-point inaccuracies.
 */

export const SUBSCRIPTION_PLAN_PRICING = {
  free: {
    code: "free",
    name: "Free Explorer",
    monthly_cents: 0,
    yearly_cents: 0,
    currency: "INR",
  },
  pro: {
    code: "pro",
    name: "AURA Pro",
    monthly_cents: 49900, // ₹499.00
    yearly_cents: 499000, // ₹4,990.00 (Save ₹998 - 2 months free)
    currency: "INR",
  },
  premium: {
    code: "premium",
    name: "Pro Creator",
    monthly_cents: 99900, // ₹999.00
    yearly_cents: 999000, // ₹9,990.00 (Save ₹1,998 - 2 months free)
    currency: "INR",
  },
} as const;

export type SupportedPlanCode = "pro" | "premium";
export type SupportedBillingCycle = "monthly" | "yearly";

export interface PlanPricingQuote {
  planCode: SupportedPlanCode;
  planName: string;
  billingCycle: SupportedBillingCycle;
  amountCents: number;
  currency: string;
}

/**
 * Returns authoritative server price for a subscription plan and billing cycle.
 * Never trust client prices.
 */
export function getAuthoritativePlanPrice(
  planCode: SupportedPlanCode,
  billingCycle: SupportedBillingCycle
): PlanPricingQuote {
  const plan = SUBSCRIPTION_PLAN_PRICING[planCode];
  if (!plan) {
    throw new Error(`Invalid or unsupported subscription plan: ${planCode}`);
  }

  const amountCents =
    billingCycle === "monthly" ? plan.monthly_cents : plan.yearly_cents;

  return {
    planCode,
    planName: plan.name,
    billingCycle,
    amountCents,
    currency: plan.currency,
  };
}

/**
 * Exact 80/20 platform/teacher revenue split using integer paise arithmetic.
 * Platform fee = 20% (2,000 basis points)
 * Teacher share = 80% (8,000 basis points)
 *
 * Example:
 * Gross = 99900 paise (₹999)
 * Platform = floor(99900 * 2000 / 10000) = 19980 paise (₹199.80)
 * Teacher = 99900 - 19980 = 79920 paise (₹799.20)
 * platform + teacher === gross (0 paise lost)
 */
export interface RevenueSplitResult {
  grossCents: number;
  platformCents: number;
  teacherCents: number;
  platformRateBps: number;
  teacherRateBps: number;
}

export function calculateRevenueSplit(grossCents: number): RevenueSplitResult {
  const safeGross = Math.max(0, Math.round(grossCents));
  const platformRateBps = 2000; // 20%
  const teacherRateBps = 8000;  // 80%

  const platformCents = Math.floor((safeGross * platformRateBps) / 10000);
  const teacherCents = safeGross - platformCents;

  return {
    grossCents: safeGross,
    platformCents,
    teacherCents,
    platformRateBps,
    teacherRateBps,
  };
}

/**
 * Safely converts Rupees to exact integer Paise without floating-point artifacts.
 */
export function rupeesToPaise(rupees: number): number {
  if (typeof rupees !== "number" || isNaN(rupees)) {
    throw new Error("Invalid rupees amount.");
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer Paise to Rupees for display or standard decimal representation.
 */
export function paiseToRupees(paise: number): number {
  if (typeof paise !== "number" || isNaN(paise)) {
    throw new Error("Invalid paise amount.");
  }
  return Math.round(paise) / 100;
}

/**
 * Formats integer paise into Indian Rupee localized string.
 */
export function formatPaiseINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface RefundPolicy {
  allowedWindowDays: number;
  allowCourseRefunds: boolean;
  allowSubscriptionRefunds: boolean;
}

export const DEFAULT_REFUND_POLICY: RefundPolicy = {
  allowedWindowDays: 30, // 30-day money-back guarantee policy
  allowCourseRefunds: true,
  allowSubscriptionRefunds: true,
};

