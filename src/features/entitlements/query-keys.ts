export const entitlementsKeys = {
  all: ['entitlements'] as const,
  usage: () => [...entitlementsKeys.all, 'usage'] as const,
  proPlan: () => [...entitlementsKeys.all, 'pro-plan'] as const,
};
