import { createHash, randomUUID } from "node:crypto";
import type {
  GatewayConfirmation,
  GatewayIntent,
  PaymentIntentQuote,
} from "./types";

export interface PaymentGateway {
  readonly name: string;
  createIntent(intent: PaymentIntentQuote): Promise<GatewayIntent>;
  confirmIntent(providerIntentId: string): Promise<GatewayConfirmation>;
}

class MockPaymentGateway implements PaymentGateway {
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

export function getPaymentGateway(): PaymentGateway {
  const provider = process.env.PAYMENT_GATEWAY ?? "mock";

  if (provider !== "mock") {
    throw new Error(
      `Payment gateway "${provider}" is not configured. Add a Stripe or Razorpay adapter before enabling it.`
    );
  }

  return new MockPaymentGateway();
}
