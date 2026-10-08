import { NextResponse } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/url";
import { getRedisClient, isRedisConfigured } from "@/lib/redis";

const START_TIME = Date.now();

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const uptimeSeconds = Math.floor((Date.now() - START_TIME) / 1000);

  const checks: Record<string, { status: "up" | "down" | "degraded"; latencyMs?: number; message?: string }> = {
    app: { status: "up" },
  };

  // 1. Check Redis connectivity
  const redisStart = Date.now();
  if (isRedisConfigured()) {
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
        checks.redis = {
          status: "up",
          latencyMs: Date.now() - redisStart,
        };
      } else {
        checks.redis = {
          status: "degraded",
          message: "Redis client initialization failed, memory fallback active",
        };
      }
    } catch (err) {
      checks.redis = {
        status: "degraded",
        latencyMs: Date.now() - redisStart,
        message: err instanceof Error ? err.message : "Redis ping failed, memory fallback active",
      };
    }
  } else {
    checks.redis = {
      status: "degraded",
      message: "Unconfigured, in-memory fail-safe cache active",
    };
  }

  // 2. Check Supabase API reachability
  const supabaseStart = Date.now();
  try {
    const supabaseUrl = getSupabaseUrl();
    const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      checks.database = {
        status: "up",
        latencyMs: Date.now() - supabaseStart,
      };
    } else {
      checks.database = {
        status: "degraded",
        latencyMs: Date.now() - supabaseStart,
        message: `HTTP ${res.status}`,
      };
    }
  } catch (err) {
    checks.database = {
      status: "degraded",
      latencyMs: Date.now() - supabaseStart,
      message: err instanceof Error ? err.message : "Supabase health ping timed out",
    };
  }

  const isHealthy = Object.values(checks).every((c) => c.status === "up");
  const isDown = checks.database?.status === "down" || checks.app?.status === "down";

  const overallStatus = isDown ? "unhealthy" : isHealthy ? "healthy" : "degraded";
  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  const mem = process.memoryUsage();

  return NextResponse.json(
    {
      status: overallStatus,
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      requestId,
      environment: process.env.NODE_ENV || "development",
      checks,
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
      },
    },
    {
      status: httpStatus,
      headers: {
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
