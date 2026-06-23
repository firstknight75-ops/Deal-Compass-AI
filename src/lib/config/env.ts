import { z } from "zod";

const nodeEnvironmentSchema = z.enum(["development", "test", "staging", "production"]);

const serverEnvironmentSchema = z.object({
  NODE_ENV: nodeEnvironmentSchema.default("development"),

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default("DealCompass AI+"),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),

  OPENAI_API_KEY: z.string().startsWith("sk-").optional(),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-large"),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith("pk_").optional(),

  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  FEATURE_FLAG_CRAWLER: z.coerce.boolean().default(false),
  FEATURE_FLAG_TRADE_FINANCE: z.coerce.boolean().default(false),
  FEATURE_FLAG_COMPLIANCE: z.coerce.boolean().default(false),
  FEATURE_FLAG_KNOWLEDGE_GRAPH: z.coerce.boolean().default(false),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

/**
 * Validates and returns typed server environment variables.
 *
 * This is intentionally lazy in the current TanStack Start app so build-time route
 * discovery does not fail before deployment environment variables are injected.
 * Call this at server request boundaries and startup hooks.
 */
export function getServerEnv(): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(process.env);

  if (!result.success) {
    const message = Object.entries(result.error.flatten().fieldErrors)
      .map(([key, errors]) => `  ${key}: ${errors?.join(", ")}`)
      .join("\n");

    throw new Error(
      `Environment validation failed. Fix the following:\n${message}\nSee .env.example for required variables.`,
    );
  }

  return result.data;
}

/**
 * Validates that the optional cache configuration is present before using Redis.
 */
export function requireCacheEnv(
  env: ServerEnvironment,
): Required<Pick<ServerEnvironment, "UPSTASH_REDIS_REST_URL" | "UPSTASH_REDIS_REST_TOKEN">> {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis cache configuration is missing. Set UPSTASH_REDIS_REST_URL and token.");
  }

  return {
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
  };
}
