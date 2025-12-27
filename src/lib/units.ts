export const WEIGHT_UNITS = {
  G: "g",
  KG: "kg",
  TON: "ton",
  LB: "lb",
  OZ: "oz",
} as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[keyof typeof WEIGHT_UNITS];

export const WEIGHT_UNIT_LABELS: Record<WeightUnit, string> = {
  [WEIGHT_UNITS.G]: "gramos/g",
  [WEIGHT_UNITS.KG]: "kilogramos/kg",
  [WEIGHT_UNITS.TON]: "toneladas/ton",
  [WEIGHT_UNITS.LB]: "libras/lb",
  [WEIGHT_UNITS.OZ]: "onzas/oz",
};

export const WEIGHT_UNIT_OPTIONS = Object.values(WEIGHT_UNITS).map((unit) => ({
  value: unit,
  label: WEIGHT_UNIT_LABELS[unit],
}));

export const WEIGHT_CONVERSIONS: Record<WeightUnit, number> = {
  [WEIGHT_UNITS.G]: 1,
  [WEIGHT_UNITS.KG]: 1000,
  [WEIGHT_UNITS.TON]: 1_000_000,
  [WEIGHT_UNITS.LB]: 453.592,
  [WEIGHT_UNITS.OZ]: 28.3495,
};

export function convertToCanonical(
  value: number,
  fromUnit: WeightUnit,
): number {
  if (isNaN(value)) return 0;
  return value * (WEIGHT_CONVERSIONS[fromUnit] ?? 1);
}

export function convertFromCanonical(
  valueInGrams: number,
  toUnit: WeightUnit,
): number {
  if (isNaN(valueInGrams)) return 0;
  return valueInGrams / (WEIGHT_CONVERSIONS[toUnit] ?? 1);
}
