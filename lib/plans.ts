export type PlanType = 'free' | 'monthly' | 'annual';

export const PLAN_LIMITS = {
  free: { maxRecipes: 3, maxIngredients: 10, canExport: false, canInvite: false, showAds: true },
  monthly: { maxRecipes: Infinity, maxIngredients: Infinity, canExport: true, canInvite: true, showAds: false },
  annual: { maxRecipes: Infinity, maxIngredients: Infinity, canExport: true, canInvite: true, showAds: false },
};

export const PLAN_PRICES = {
  monthly: { display: 'R91', period: '/month' },
  annual: { display: 'R910', period: '/year', savings: 'Save R182' },
};

export const PAYSTACK_URLS = {
  monthly: process.env.EXPO_PUBLIC_PAYSTACK_MONTHLY_URL || 'https://paystack.shop/pay/mz6y9d-cjw',
  annual: process.env.EXPO_PUBLIC_PAYSTACK_ANNUAL_URL || 'https://paystack.shop/pay/l0yv1qgt3y',
};
