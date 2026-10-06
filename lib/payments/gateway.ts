import { createHash, randomUUID } from "node:crypto";
import type {
  GatewayConfirmation,
  GatewayIntent,
  PaymentIntentQuote,
} from "./types.ts";
import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "./razorpay.ts";

export interface PaymentGateway {
  readonly name: string;
  createIntent(intent: PaymentIntentQuote): Promise<GatewayIntent>;
  confirmIntent(providerIntentId: string): Promise<GatewayConfirmation>;
}

export class MockPaymentGateway implements PaymentGateway {
  readonly name = "mock";

  async createIntent(intent: PaymentIntentQuote): Promise<GatewayIntent> {
    const providerIntentId = `pi_mock_${intent.id.replaceAll("-", "")}`;
    const signature = createHash("sha256")
      .update(`${providerIntentId}:${intent.total_cents}:${intent.currency}`)
      .digest("hex")
      .slice(0, 32);

    return {
      provider: this.name,
      providerIntentId,
      clientSecret: `${providerIntentId}_secret_${signature}`,
    };
  }

  async confirmIntent(providerIntentId: string): Promise<GatewayConfirmation> {
    if (!providerIntentId.startsWith("pi_mock_")) {
      throw new Error("The mock gateway rejected the provider intent.");
    }

    return {
      providerPaymentId: `pay_mock_${randomUUID().replaceAll("-", "")}`,
      status: "succeeded",
    };
  }
}

export class RazorpayPaymentGateway implements PaymentGateway {
  readonly name = "razorpay";

  async createIntent(intent: PaymentIntentQuote): Promise<GatewayIntent> {
    const keyId = getRazorpayKeyId();
    if (!keyId) {
      throw new Error("Razorpay Key ID is missing in environment.");
    }

    const order = await createRazorpayOrder({
      amountPaise: intent.total_cents,
      currency: "INR",
      receipt: intent.id,
      notes: {
        aura_intent_id: intent.id,
        purchase_type: String(intent.pricing_snapshot?.purchase_type || "general"),
      },
    });

    return {
      provider: this.name,
      providerIntentId: order.id,
      clientSecret: order.id,
      razorpayKeyId: keyId,
      razorpayOrderId: order.id,
    };
  }

  async confirmIntent(providerIntentId: string): Promise<GatewayConfirmation> {
    const order = await fetchRazorpayOrder(providerIntentId);
    if (order.status !== "paid" && order.status !== "attempted" && order.status !== "created") {
      throw new Error(`Razorpay order is in an invalid state: ${order.status}`);
    }

    return {
      providerPaymentId: providerIntentId,
      status: "succeeded",
    };
  }
}

export function getPaymentGateway(): PaymentGateway {
  const provider = (process.env.PAYMENT_GATEWAY ?? "").toLowerCase().trim();

  if (provider === "razorpay" || (!provider && isRazorpayConfigured())) {
    return new RazorpayPaymentGateway();
  }

  if (provider === "mock" || !provider) {
    return new MockPaymentGateway();
  }

  throw new Error(
    `Payment gateway "${provider}" is not configured. Supported gateways are "razorpay" and "mock".`
  );
}
