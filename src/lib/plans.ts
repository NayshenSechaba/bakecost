export type PlanType = 'free' | 'monthly' | 'annual';

export const PLAN_LIMITS = {
  free: { maxRecipes: 3, maxIngredients: 10, canExport: false, canInvite: false, showAds: true },
  monthly: { maxRecipes: Infinity, maxIngredients: Infinity, canExport: true, canInvite: true, showAds: false },
  annual: { maxRecipes: Infinity, maxIngredients: Infinity, canExport: true, canInvite: true, showAds: false },
};

export const PLAN_PRICES = {
  monthly: { amount: 9100, display: 'R91', period: '/month' },
  annual: { amount: 91000, display: 'R910', period: '/year', savings: 'Save R182' },
};
