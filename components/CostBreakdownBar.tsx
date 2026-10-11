import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/theme';
import { formatZAR } from '@/lib/utils';

interface Props {
  ingredientsCost: number;
  laborCost: number;
  overheadCost: number;
  sellingPrice: number;
}
export default function CostBreakdownBar({ ingredientsCost = 0, laborCost = 0, overheadCost = 0, sellingPrice = 0 }: Props) {
  const totalCost = ingredientsCost + laborCost + overheadCost;
  const profit = Math.max(0, sellingPrice - totalCost);
  const denom = Math.max(sellingPrice, totalCost, 1);
  const ingPct = (ingredientsCost / denom) * 100;
  const labPct = (laborCost / denom) * 100;
  const ovhPct = (overheadCost / denom) * 100;
  const prfPct = (profit / denom) * 100;
  const isLoss = sellingPrice > 0 && sellingPrice < totalCost;

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.bar}>
        <View style={[styles.seg, { flex: ingPct, backgroundColor: COLORS.slate900 }]} />
        <View style={[styles.seg, { flex: labPct, backgroundColor: COLORS.caramel }]} />
        <View style={[styles.seg, { flex: ovhPct, backgroundColor: COLORS.sand300 }]} />
        {profit > 0 && <View style={[styles.seg, { flex: prfPct, backgroundColor: COLORS.pink }]} />}
      </View>

      {isLoss && (
        <Text style={styles.lossText}>Loss of {formatZAR(totalCost - sellingPrice)} per batch</Text>
      )}

      <View style={styles.legend}>
        <LegendItem color={COLORS.slate900} label="Ingredients" value={formatZAR(ingredientsCost)} />
        <LegendItem color={COLORS.caramel} label="Labour" value={formatZAR(laborCost)} />
        <LegendItem color={COLORS.sand300} label="Overhead" value={formatZAR(overheadCost)} />
        <LegendItem color={COLORS.pink} label="Profit" value={formatZAR(profit)} />
      </View>
    </View>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={styles.legendText}>{label}: </Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', height: 14, borderRadius: 100, overflow: 'hidden', backgroundColor: COLORS.sand200 },
  seg: { height: '100%' },
  lossText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 4 },
  legendText: { fontSize: 12, color: COLORS.slate600 },
  legendValue: { fontSize: 12, color: COLORS.slate900, fontWeight: '600' },
});
