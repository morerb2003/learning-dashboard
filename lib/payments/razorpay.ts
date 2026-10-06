import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

if (typeof window !== "undefined") {
  throw new Error("Razorpay server integration cannot be imported on the client.");
}

export interface RazorpayOrderResult {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string | null;
  status: "created" | "attempted" | "paid";
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface RazorpayPaymentResult {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
}

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentSignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}

export interface VerifyWebhookSignatureParams {
  rawBody: string;
  signature: string;
  secret?: string;
}

let razorpayClientInstance: Razorpay | null = null;

/**
 * Checks whether Razorpay credentials are fully provided in the server environment.
 */
export function isRazorpayConfigured(): boolean {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(keyId && keySecret);
}

/**
 * Returns the public Razorpay Key ID for client checkout.
 * Returns null if unconfigured.
 */
export function getRazorpayKeyId(): string | null {
  return process.env.RAZORPAY_KEY_ID?.trim() || null;
}

/**
 * Returns or initializes the singleton Razorpay instance.
 * Throws a descriptive error if environment credentials are missing.
 */
export function getRazorpayClient(): Razorpay {
  if (razorpayClientInstance) {
    return razorpayClientInstance;
  }

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay credentials are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
    );
  }

  razorpayClientInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayClientInstance;
}

/**
 * Creates an order on Razorpay servers.
 * The amount must be specified in the smallest currency unit (e.g. paise for INR).
 */
export async function createRazorpayOrder(
  params: CreateOrderParams
): Promise<RazorpayOrderResult> {
  const razorpay = getRazorpayClient();
  const currency = (params.currency || "INR").toUpperCase();
  const amount = Math.round(params.amountPaise);

  if (amount <= 0) {
    throw new Error("Order amount must be greater than zero.");
  }

  // Razorpay limits receipts to 40 characters
  const receipt = params.receipt.slice(0, 40);

  try {
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: params.notes,
    });

    return order as unknown as RazorpayOrderResult;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to create Razorpay order.";
    throw new Error(`Razorpay Order Creation Error: ${errorMsg}`);
  }
}

/**
 * Fetches an existing Razorpay Order by ID.
 */
export async function fetchRazorpayOrder(
  orderId: string
): Promise<RazorpayOrderResult> {
  if (!orderId?.trim()) {
    throw new Error("Razorpay Order ID is required.");
  }

  const razorpay = getRazorpayClient();

  try {
    const order = await razorpay.orders.fetch(orderId.trim());
    return order as unknown as RazorpayOrderResult;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch Razorpay order.";
    throw new Error(`Razorpay Order Fetch Error: ${errorMsg}`);
  }
}

/**
 * Fetches an existing Razorpay Payment by ID.
 */
export async function fetchRazorpayPayment(
  paymentId: string
): Promise<RazorpayPaymentResult> {
  if (!paymentId?.trim()) {
    throw new Error("Razorpay Payment ID is required.");
  }

  const razorpay = getRazorpayClient();

  try {
    const payment = await razorpay.payments.fetch(paymentId.trim());
    return payment as unknown as RazorpayPaymentResult;
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch Razorpay payment.";
    throw new Error(`Razorpay Payment Fetch Error: ${errorMsg}`);
  }
}

/**
 * Verifies Razorpay payment signature from client checkout using HMAC-SHA256.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
 */
export function verifyRazorpayPaymentSignature(
  params: VerifyPaymentSignatureParams
): boolean {
  const secret = params.secret ?? process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!secret) {
    return false;
  }

  if (!params.orderId?.trim() || !params.paymentId?.trim() || !params.signature?.trim()) {
    return false;
  }

  try {
    const payload = `${params.orderId.trim()}|${params.paymentId.trim()}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(params.signature.trim(), "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay webhook signature using HMAC-SHA256.
 * Formula: HMAC_SHA256(raw_body, webhook_secret) == signature
 */
export function verifyRazorpayWebhookSignature(
  params: VerifyWebhookSignatureParams
): boolean {
  const secret = params.secret ?? process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return false;
  }

  if (!params.signature?.trim() || typeof params.rawBody !== "string") {
    return false;
  }

  try {
    const expectedSignature = createHmac("sha256", secret)
      .update(params.rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(params.signature.trim(), "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
}
