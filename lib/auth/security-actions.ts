"use server";

import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  checkLoginThrottled,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/security-tracking";

async function getRequestIp(): Promise<string> {
  const reqHeaders = await headers();
  return getClientIp(reqHeaders);
}

export interface SecurityCheckResult {
  allowed: boolean;
  error?: string;
  retryAfterSeconds?: number;
}

/**
 * Pre-check rate limits and failed attempt lockouts before submitting login credentials.
 */
export async function preCheckLoginAction(
  email?: string
): Promise<SecurityCheckResult> {
  const ip = await getRequestIp();

  // 1. Rate limit: 5 requests / minute / IP
  const rateLimit = await checkRateLimit("authLogin", ip);
  if (!rateLimit.success) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
    return {
      allowed: false,
      error: `Too many login requests from this network. Please wait ${retryAfter} seconds.`,
      retryAfterSeconds: retryAfter,
    };
  }

  // 2. Security counter: Repeated failed attempts
  const throttleCheck = await checkLoginThrottled(ip, email);
  if (throttleCheck.throttled) {
    return {
      allowed: false,
      error: `Account access temporarily throttled due to multiple failed attempts. Please retry in ${Math.ceil(throttleCheck.retryAfterSeconds / 60)} minutes.`,
      retryAfterSeconds: throttleCheck.retryAfterSeconds,
    };
  }

  return { allowed: true };
}

/**
 * Record login success or failure to update Redis security trackers.
 */
export async function recordLoginAttemptAction(
  email: string,
  success: boolean
): Promise<{ remainingAttempts?: number }> {
  const ip = await getRequestIp();

  if (success) {
    await recordLoginSuccess(ip, email);
    return {};
  } else {
    const failureResult = await recordLoginFailure(ip, email);
    return { remainingAttempts: failureResult.remainingAttempts };
  }
}

/**
 * Rate limit signup requests: 5 requests / 10 minutes / IP.
 */
export async function preCheckSignupAction(): Promise<SecurityCheckResult> {
  const ip = await getRequestIp();
  const rateLimit = await checkRateLimit("authSignup", ip);
  if (!rateLimit.success) {
    const retryAfterMinutes = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 60000));
    return {
      allowed: false,
      error: `Too many registration attempts. Please try again in ${retryAfterMinutes} minutes.`,
    };
  }

  return { allowed: true };
}

/**
 * Rate limit password reset requests: 3 requests / 10 minutes / IP.
 */
export async function preCheckPasswordResetAction(
  email?: string
): Promise<SecurityCheckResult> {
  const ip = await getRequestIp();
  const identifier = email ? `${ip}:${email.trim().toLowerCase()}` : ip;
  const rateLimit = await checkRateLimit("authPasswordReset", identifier);
  if (!rateLimit.success) {
    const retryAfterMinutes = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 60000));
    return {
      allowed: false,
      error: `Too many password reset requests. Please try again in ${retryAfterMinutes} minutes.`,
    };
  }

  return { allowed: true };
}
