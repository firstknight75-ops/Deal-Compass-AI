import { Redis } from "@upstash/redis";
import { getServerEnv, requireCacheEnv } from "../config";
import { RateLimitError } from "../errors";

export interface RateLimitConfig {
  readonly limit: number;
  readonly windowSeconds: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: Date;
}

export const RATE_LIMITS = {
  public: { limit: 60, windowSeconds: 60 },
  authenticated: { limit: 300, windowSeconds: 60 },
  ai: { limit: 30, windowSeconds: 60 },
  crawler: { limit: 10, windowSeconds: 60 },
  auth: { limit: 10, windowSeconds: 300 },
} as const satisfies Record<string, RateLimitConfig>;

let redisClient: Redis | undefined;

function getRedisClient(): Redis {
  if (redisClient) return redisClient;

  const env = requireCacheEnv(getServerEnv());
  redisClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });

  return redisClient;
}

/**
 * Checks and increments a sliding-window rate limit for an identifier.
 *
 * @throws RateLimitError when the configured limit is exceeded.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `ratelimit:${identifier}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - config.windowSeconds;

  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zadd(key, { score: now, member: `${now}-${crypto.randomUUID()}` });
  pipeline.zcard(key);
  pipeline.expire(key, config.windowSeconds + 1);

  const results = await pipeline.exec();
  const count = Number(results[2] ?? 0);
  const remaining = Math.max(0, config.limit - count);
  const resetAt = new Date((now + config.windowSeconds) * 1000);

  if (count > config.limit) {
    throw new RateLimitError(config.windowSeconds);
  }

  return { allowed: true, remaining, resetAt };
}

/**
 * Wraps a server route handler with rate-limit response headers.
 */
export async function withRateLimit(
  identifier: string,
  config: RateLimitConfig,
  handler: () => Promise<Response>,
): Promise<Response> {
  const result = await checkRateLimit(identifier, config);
  const response = await handler();
  const headers = new Headers(response.headers);

  headers.set("X-RateLimit-Limit", config.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
