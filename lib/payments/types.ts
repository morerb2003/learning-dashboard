export type PurchaseType = "course" | "subscription";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionPlanCode = "pro" | "premium";

export interface CreatePaymentIntentInput {
  purchaseType: PurchaseType;
  courseId?: string;
  planCode?: SubscriptionPlanCode;
  billingCycle?: BillingCycle;
  couponCode?: string;
  idempotencyKey: string;
}

export interface PaymentIntentQuote {
  id: string;
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "processing"
    | "succeeded"
    | "failed"
    | "canceled";
  currency: string;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  expires_at: string;
  pricing_snapshot: Record<string, unknown>;
}

export interface ClientPaymentIntent extends PaymentIntentQuote {
  provider: string;
  clientSecret: string;
}

export interface ConfirmedPayment {
  payment_id: string;
  subscription_id?: string | null;
  status: "succeeded";
}

export interface GatewayIntent {
  provider: string;
  providerIntentId: string;
  clientSecret: string;
}

export interface GatewayConfirmation {
  providerPaymentId: string;
  status: "succeeded";
}
