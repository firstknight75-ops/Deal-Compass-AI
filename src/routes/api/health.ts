import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/config";
import { errorToResponse } from "@/lib/errors";
import { createLogger } from "@/lib/logging";

interface ServiceHealth {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly latencyMs?: number;
  readonly error?: string;
}

interface HealthResponse {
  readonly status: "healthy" | "degraded" | "unhealthy";
  readonly version: string;
  readonly environment: string;
  readonly timestamp: string;
  readonly services: {
    readonly database: ServiceHealth;
    readonly cache: ServiceHealth;
    readonly ai: ServiceHealth;
  };
}

const healthLogger = createLogger("health-check");

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const env = getServerEnv();
          const checks = await Promise.allSettled([
            checkDatabase(env),
            checkCache(env),
            checkAI(env),
          ]);
          const database = resultToHealth(checks[0]);
          const cache = resultToHealth(checks[1]);
          const ai = resultToHealth(checks[2]);

          const criticalServicesHealthy = database.status === "healthy";
          const overallStatus = !criticalServicesHealthy
            ? "unhealthy"
            : cache.status !== "healthy" || ai.status !== "healthy"
              ? "degraded"
              : "healthy";

          const response: HealthResponse = {
            status: overallStatus,
            version: env.NEXT_PUBLIC_APP_VERSION ?? "unknown",
            environment: env.NODE_ENV,
            timestamp: new Date().toISOString(),
            services: { database, cache, ai },
          };

          if (overallStatus !== "healthy") {
            healthLogger.warn("Health check degraded", { response });
          }

          return Response.json(response, { status: overallStatus === "unhealthy" ? 503 : 200 });
        } catch (error) {
          return errorToResponse(error);
        }
      },
    },
  },
});

function resultToHealth(result: PromiseSettledResult<ServiceHealth>): ServiceHealth {
  if (result.status === "fulfilled") return result.value;
  return { status: "unhealthy", error: "Health check failed" };
}

async function checkDatabase(env: ReturnType<typeof getServerEnv>): Promise<ServiceHealth> {
  const start = Date.now();

  try {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY,
      {
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { error } = await supabase.from("health_check").select("id").eq("id", 1).single();

    if (error) {
      return {
        status: "unhealthy",
        latencyMs: Date.now() - start,
        error: "Database health check failed",
      };
    }

    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "unhealthy", latencyMs: Date.now() - start, error: "Database unreachable" };
  }
}

async function checkCache(env: ReturnType<typeof getServerEnv>): Promise<ServiceHealth> {
  const start = Date.now();

  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return { status: "degraded", latencyMs: Date.now() - start, error: "Cache not configured" };
  }

  try {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.ping();
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - start, error: "Cache unreachable" };
  }
}

async function checkAI(env: ReturnType<typeof getServerEnv>): Promise<ServiceHealth> {
  const start = Date.now();

  if (!env.OPENAI_API_KEY) {
    return { status: "degraded", latencyMs: Date.now() - start, error: "AI not configured" };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        status: "degraded",
        latencyMs: Date.now() - start,
        error: "AI service returned error",
      };
    }

    return { status: "healthy", latencyMs: Date.now() - start };
  } catch {
    return { status: "degraded", latencyMs: Date.now() - start, error: "AI service unreachable" };
  }
}
