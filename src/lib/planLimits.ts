export type PlanType = 'free' | 'plus' | 'pro';

export interface PlanLimits {
  maxCards: number;
  maxTransactionsPerMonth: number;
  maxSavingsGoals: number;
  allowedPages: string[];
}

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  free: {
    maxCards: 3,
    maxTransactionsPerMonth: 30,
    maxSavingsGoals: 1,
    allowedPages: ['/', '/transactions'],
  },
  plus: {
    maxCards: 10,
    maxTransactionsPerMonth: 200,
    maxSavingsGoals: 5,
    allowedPages: ['/', '/transactions', '/categories', '/cards', '/invoices'],
  },
  pro: {
    maxCards: Infinity,
    maxTransactionsPerMonth: Infinity,
    maxSavingsGoals: Infinity,
    allowedPages: ['/', '/transactions', '/categories', '/cards', '/invoices', '/savings', '/recurring', '/simulation'],
  },
};

export const PLAN_LABELS: Record<PlanType, string> = {
  free: 'Grátis',
  plus: 'Plus',
  pro: 'Pro',
};

export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  plus: 10,
  pro: 15,
};

export function getRequiredPlan(page: string): PlanType {
  if (PLAN_CONFIG.free.allowedPages.includes(page)) return 'free';
  if (PLAN_CONFIG.plus.allowedPages.includes(page)) return 'plus';
  return 'pro';
}

export function canAccessPage(plan: PlanType, page: string): boolean {
  return PLAN_CONFIG[plan].allowedPages.includes(page);
}
