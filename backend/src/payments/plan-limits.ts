export interface PlanLimits {
  maxStores: number;
  maxPrograms: number;
  maxMembers: number;
  maxTransactionsPerMonth: number;
  analytics: boolean;
  campaigns: boolean;
  pushNotifications: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  whitelabel: boolean;
  multiStore: boolean;
  staffAccounts: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    maxStores: 1,
    maxPrograms: 1,
    maxMembers: 50,
    maxTransactionsPerMonth: 100,
    analytics: false,
    campaigns: false,
    pushNotifications: false,
    customDomain: false,
    apiAccess: false,
    whitelabel: false,
    multiStore: false,
    staffAccounts: 0,
  },
  PRO: {
    maxStores: 1,
    maxPrograms: 3,
    maxMembers: 500,
    maxTransactionsPerMonth: 9999,
    analytics: true,
    campaigns: true,
    pushNotifications: true,
    customDomain: false,
    apiAccess: false,
    whitelabel: false,
    multiStore: false,
    staffAccounts: 2,
  },
  BUSINESS: {
    maxStores: 3,
    maxPrograms: 999,
    maxMembers: 2000,
    maxTransactionsPerMonth: 99999,
    analytics: true,
    campaigns: true,
    pushNotifications: true,
    customDomain: false,
    apiAccess: false,
    whitelabel: false,
    multiStore: true,
    staffAccounts: 10,
  },
  ENTERPRISE: {
    maxStores: 999,
    maxPrograms: 9999,
    maxMembers: 99999,
    maxTransactionsPerMonth: 999999,
    analytics: true,
    campaigns: true,
    pushNotifications: true,
    customDomain: true,
    apiAccess: true,
    whitelabel: true,
    multiStore: true,
    staffAccounts: 999,
  },
};

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

export const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  PRO: { monthly: 49, yearly: 470.4 },
  BUSINESS: { monthly: 99, yearly: 950.4 },
  ENTERPRISE: { monthly: 199, yearly: 1910.4 },
};
