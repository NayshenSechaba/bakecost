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
 * Economies of scale multiplier for labor.
 * In commercial baking, scaling from 1x to 4x batch size takes ~2.4x time (not 4.0x time),
 * because prep, weighing, oven monitoring, and cleaning have large fixed components.
 */
export function laborScaleFactor(scaleFactor: number): number {
  if (scaleFactor <= 0) return 0;
  if (scaleFactor === 1) return 1;
  // 35% fixed setup + 65% sublinear variable run time
  return 0.35 + 0.65 * Math.pow(scaleFactor, 0.85);
}

/**
 * Economies of scale multiplier for oven electricity & utilities.
 * Preheating the oven and maintaining temperature is ~50-60% fixed energy
 * whether baking 1 tray or 4 trays in the same deck/convection oven.
 */
export function energyScaleFactor(scaleFactor: number): number {
  if (scaleFactor <= 0) return 0;
  if (scaleFactor === 1) return 1;
  // 50% fixed heat/base overhead + 50% sublinear variable energy
  return 0.50 + 0.50 * Math.pow(scaleFactor, 0.70);
}

/**
 * Calculate scaled labor cost applying economies of scale.
 */
export function calculateScaledLaborCost(baseLaborCost: number, scaleFactor: number): number {
  return baseLaborCost * laborScaleFactor(scaleFactor);
}

/**
 * Calculate scaled electricity cost applying economies of scale.
 */
export function calculateScaledElectricityCost(baseElectricityCost: number, scaleFactor: number): number {
  return baseElectricityCost * energyScaleFactor(scaleFactor);
}

/**
 * Calculate scaled utility cost applying economies of scale.
 */
export function calculateScaledUtilityCost(baseUtilityCost: number, scaleFactor: number): number {
  return baseUtilityCost * energyScaleFactor(scaleFactor);
}

/**
 * Compute total cost for a scaled batch (ingredients + labor + overheads + packaging).
 * Applies economies of scale to labor, electricity, and utilities.
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
  const scaleFactor = baseBatchSize > 0 ? targetBatchSize / baseBatchSize : 1;

  const ingredientCost = recipeIngredients.reduce((total, ri) => {
    const costPerUnit = ri.ingredient?.cost_per_unit ?? 0;
    const scaledQty = scaleQty(ri.quantity_at_base, baseBatchSize, targetBatchSize);
    return total + scaledQty * costPerUnit;
  }, 0);

  const baseLaborCost = (laborTimeMins / 60) * laborRatePerHour;
  const scaledLabor = calculateScaledLaborCost(baseLaborCost, scaleFactor);
  const scaledElectricity = calculateScaledElectricityCost(electricityCost, scaleFactor);
  const scaledPackaging = targetBatchSize * packagingCostPerUnit;
  const scaledUtility = calculateScaledUtilityCost(utilityCost, scaleFactor);

  return ingredientCost + scaledLabor + scaledElectricity + scaledPackaging + scaledUtility;
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
 * Smart stock display with dual unit/weight breakdown.
 * e.g., 12500 g -> "12.5 kg (12,500 g)"
 * e.g., 2500 ml -> "2.5 L (2,500 ml)"
 * e.g., 750 g   -> "750 g"
 */
export function formatStockDisplay(stock: number, unit: string): string {
  if (stock == null || isNaN(stock)) return `0 ${unitLabel(unit)}`;
  const rounded = Math.round(stock * 100) / 100;

  if (unit === 'g') {
    if (rounded >= 1000) {
      const kg = (rounded / 1000).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
      const g = rounded.toLocaleString('en-ZA');
      return `${kg} kg (${g} g)`;
    }
    return `${rounded.toLocaleString('en-ZA')} g`;
  }

  if (unit === 'ml') {
    if (rounded >= 1000) {
      const l = (rounded / 1000).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
      const ml = rounded.toLocaleString('en-ZA');
      return `${l} L (${ml} ml)`;
    }
    return `${rounded.toLocaleString('en-ZA')} ml`;
  }

  if (unit === 'kg') {
    const g = (rounded * 1000).toLocaleString('en-ZA');
    return `${rounded.toLocaleString('en-ZA')} kg (${g} g)`;
  }

  if (unit === 'l') {
    const ml = (rounded * 1000).toLocaleString('en-ZA');
    return `${rounded.toLocaleString('en-ZA')} L (${ml} ml)`;
  }

  return `${rounded.toLocaleString('en-ZA')} ${unitLabel(unit)}`;
}

/**
 * Short stock display for compact badges and list cards.
 */
export function formatStockShort(stock: number, unit: string): string {
  if (stock == null || isNaN(stock)) return `0 ${unitLabel(unit)}`;
  const rounded = Math.round(stock * 100) / 100;

  if (unit === 'g' && rounded >= 1000) {
    const kg = (rounded / 1000).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
    return `${kg} kg`;
  }
  if (unit === 'ml' && rounded >= 1000) {
    const l = (rounded / 1000).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
    return `${l} L`;
  }

  return `${rounded.toLocaleString('en-ZA')} ${unitLabel(unit)}`;
}

/**
 * Truncate text to a max length.
 */
export function truncate(text: string, max = 30): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}
