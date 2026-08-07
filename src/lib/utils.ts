/**
 * Format a number as South African Rand (ZAR).
 */
export function formatZAR(amount: number): string {
  return `R ${amount.toFixed(2)}`;
}

/**
 * Scale a quantity from the base batch size to the target batch size.
 */
export function scaleQty(quantityAtBase: number, baseBatchSize: number, targetBatchSize: number): number {
  if (baseBatchSize <= 0) return 0;
  return (quantityAtBase / baseBatchSize) * targetBatchSize;
}

/**
 * Compute the suggested selling price given cost per unit and target margin %.
 * Formula: costPerUnit / (1 - marginPct / 100)
 */
export function suggestedPrice(costPerUnit: number, targetMarginPct: number): number {
  const margin = targetMarginPct / 100;
  if (margin >= 1) return costPerUnit * 10; // safety guard
  return costPerUnit / (1 - margin);
}

/**
 * Compute total cost for a scaled batch (ingredients + labor).
 */
export function scaledTotalCost(
  recipeIngredients: { quantity_at_base: number; ingredient?: { cost_per_unit: number } }[],
  baseBatchSize: number,
  targetBatchSize: number,
  laborTimeMins = 0,
  laborRatePerHour = 0,
  electricityCost = 0,
  packagingCostPerUnit = 0,
  utilityCost = 0
): number {
  const ingredientCost = recipeIngredients.reduce((total, ri) => {
    const costPerUnit = ri.ingredient?.cost_per_unit ?? 0;
    const scaledQty = scaleQty(ri.quantity_at_base, baseBatchSize, targetBatchSize);
    return total + scaledQty * costPerUnit;
  }, 0);

  const baseLaborCost = (laborTimeMins / 60) * laborRatePerHour;
  const scaledLaborCost = baseBatchSize > 0 ? (baseLaborCost / baseBatchSize) * targetBatchSize : 0;
  const scaledElectricityCost = baseBatchSize > 0 ? (electricityCost / baseBatchSize) * targetBatchSize : 0;
  const scaledPackagingCost = targetBatchSize * packagingCostPerUnit;
  const scaledUtilityCost = baseBatchSize > 0 ? (utilityCost / baseBatchSize) * targetBatchSize : 0;

  return ingredientCost + scaledLaborCost + scaledElectricityCost + scaledPackagingCost + scaledUtilityCost;
}

/**
 * Calculate the base labor cost for a recipe.
 */
export function calculateLaborCost(laborTimeMins: number, laborRatePerHour: number): number {
  return (laborTimeMins / 60) * laborRatePerHour;
}

/**
 * Return a CSS class for stock status.
 */
export function stockStatus(current: number, threshold: number): 'ok' | 'low' | 'critical' {
  if (current <= 0) return 'critical';
  if (current <= threshold) return 'low';
  return 'ok';
}

/**
 * Format a unit label for display.
 */
export function unitLabel(unit: string): string {
  const labels: Record<string, string> = {
    g: 'g',
    kg: 'kg',
    ml: 'ml',
    l: 'L',
    unit: 'unit(s)',
  };
  return labels[unit] ?? unit;
}

/**
 * Truncate text to a max length.
 */
export function truncate(text: string, max = 30): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
