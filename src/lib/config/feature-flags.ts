import { getServerEnv } from "./env";

export interface FeatureFlags {
  readonly crawler: boolean;
  readonly tradeFinance: boolean;
  readonly compliance: boolean;
  readonly knowledgeGraph: boolean;
}

export type FeatureFlag = keyof FeatureFlags;

/**
 * Reads feature flags from validated environment variables.
 * Feature flags control visibility only and must never be used for authorization.
 */
export function getFeatureFlags(): FeatureFlags {
  const env = getServerEnv();

  return {
    crawler: env.FEATURE_FLAG_CRAWLER,
    tradeFinance: env.FEATURE_FLAG_TRADE_FINANCE,
    compliance: env.FEATURE_FLAG_COMPLIANCE,
    knowledgeGraph: env.FEATURE_FLAG_KNOWLEDGE_GRAPH,
  };
}

/**
 * Checks whether a feature is enabled for server-side execution paths.
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return getFeatureFlags()[flag];
}
