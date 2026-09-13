'use client';

import React from 'react';
import { formatZAR } from '@/lib/utils';

interface CostBreakdownBarProps {
  ingredientsCost: number;
  laborCost: number;
  overheadCost: number;
  sellingPrice: number;
  showLegend?: boolean;
  className?: string;
}

export default function CostBreakdownBar({
  ingredientsCost = 0,
  laborCost = 0,
  overheadCost = 0,
  sellingPrice = 0,
  showLegend = true,
  className = '',
}: CostBreakdownBarProps) {
  const totalCost = ingredientsCost + laborCost + overheadCost;
  const profit = Math.max(0, sellingPrice - totalCost);
  const denominator = Math.max(sellingPrice, totalCost, 1);

  const ingPct = (ingredientsCost / denominator) * 100;
  const labPct = (laborCost / denominator) * 100;
  const ovhPct = (overheadCost / denominator) * 100;
  const prfPct = (profit / denominator) * 100;

  const isLoss = sellingPrice > 0 && sellingPrice < totalCost;
  const lossAmount = totalCost - sellingPrice;

  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {/* 4-Segment Breakdown Bar */}
      <div className="w-full h-3.5 bg-sand-200 rounded-full overflow-hidden flex shadow-inner">
        {/* 1. Ingredients: slate-900 #26221F */}
        <div
          style={{ width: `${ingPct}%` }}
          className="h-full bg-slate-900 transition-all duration-300"
          title={`Ingredients: ${formatZAR(ingredientsCost)} (${ingPct.toFixed(1)}%)`}
        />
        {/* 2. Labour: caramel #C68A4C */}
        <div
          style={{ width: `${labPct}%` }}
          className="h-full bg-[#C68A4C] transition-all duration-300"
          title={`Labour: ${formatZAR(laborCost)} (${labPct.toFixed(1)}%)`}
        />
        {/* 3. Overhead: sand-300 #D8D2C9 */}
        <div
          style={{ width: `${ovhPct}%` }}
          className="h-full bg-[#D8D2C9] transition-all duration-300"
          title={`Overhead & Utilities: ${formatZAR(overheadCost)} (${ovhPct.toFixed(1)}%)`}
        />
        {/* 4. Profit: pink #E56B8C */}
        {profit > 0 && (
          <div
            style={{ width: `${prfPct}%` }}
            className="h-full bg-[#E56B8C] transition-all duration-300"
            title={`Profit: ${formatZAR(profit)} (${prfPct.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* Loss indicator if selling price is under cost */}
      {isLoss && (
        <div className="text-xs text-danger font-semibold flex items-center gap-1.5">
          <span>⚠️ Loss of {formatZAR(lossAmount)} per batch (Selling price under total cost)</span>
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 flex-shrink-0" />
            <span className="truncate">Ingredients: <strong>{formatZAR(ingredientsCost)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C68A4C] flex-shrink-0" />
            <span className="truncate">Labour: <strong>{formatZAR(laborCost)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D8D2C9] flex-shrink-0" />
            <span className="truncate">Overhead: <strong>{formatZAR(overheadCost)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E56B8C] flex-shrink-0" />
            <span className="truncate">Profit: <strong>{formatZAR(profit)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
