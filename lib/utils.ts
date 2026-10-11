export function formatZAR(amount: number): string {
  return `R ${amount.toFixed(2)}`;
}

export function scaleQty(quantityAtBase: number, baseBatchSize: number, targetBatchSize: number): number {
  if (baseBatchSize <= 0) return 0;
  return (quantityAtBase / baseBatchSize) * targetBatchSize;
}

export function suggestedPrice(costPerUnit: number, targetMarginPct: number): number {
  const margin = targetMarginPct / 100;
  if (margin >= 1) return costPerUnit * 10;
  return costPerUnit / (1 - margin);
}

export function laborScaleFactor(scaleFactor: number): number {
  if (scaleFactor <= 0) return 0;
  if (scaleFactor === 1) return 1;
  return 0.35 + 0.65 * Math.pow(scaleFactor, 0.85);
}

export function energyScaleFactor(scaleFactor: number): number {
  if (scaleFactor <= 0) return 0;
  if (scaleFactor === 1) return 1;
  return 0.50 + 0.50 * Math.pow(scaleFactor, 0.70);
}

export function calculateScaledLaborCost(baseLaborCost: number, sf: number): number {
  return baseLaborCost * laborScaleFactor(sf);
}

export function calculateScaledElectricityCost(baseElec: number, sf: number): number {
  return baseElec * energyScaleFactor(sf);
}

export function calculateScaledUtilityCost(baseUtil: number, sf: number): number {
  return baseUtil * energyScaleFactor(sf);
}

export function calculateLaborCost(laborTimeMins: number, laborRatePerHour: number): number {
  return (laborTimeMins / 60) * laborRatePerHour;
}

export function stockStatus(current: number, threshold: number): 'ok' | 'low' | 'critical' {
  if (current <= 0) return 'critical';
  if (current <= threshold) return 'low';
  return 'ok';
}

export function unitLabel(unit: string): string {
  const labels: Record<string, string> = {
    g: 'g', kg: 'kg', ml: 'ml', l: 'L', unit: 'unit(s)',
  };
  return labels[unit] ?? unit;
}

export function formatStockDisplay(stock: number, unit: string): string {
  if (stock == null || isNaN(stock)) return `0 ${unitLabel(unit)}`;
  const rounded = Math.round(stock * 100) / 100;

  if (unit === 'g') {
    if (rounded >= 1000) {
      const kg = (rounded / 1000).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
      return `${kg} kg`;
    }
    return `${rounded.toLocaleString('en-ZA')} g`;
  }
  if (unit === 'ml') {
    if (rounded >= 1000) {
      const l = (rounded / 1000).toLocaleString('en-ZA', { maximumFractionDigits: 2 });
      return `${l} L`;
    }
    return `${rounded.toLocaleString('en-ZA')} ml`;
  }
  return `${rounded.toLocaleString('en-ZA')} ${unitLabel(unit)}`;
}
