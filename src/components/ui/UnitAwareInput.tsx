"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  WeightUnit,
  WEIGHT_UNIT_OPTIONS,
  convertToCanonical,
  convertFromCanonical,
  WEIGHT_UNITS,
  WEIGHT_CONVERSIONS,
} from "@/lib/units";
import { Input } from "./input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface UnitAwareInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  valueInCanonicalUnit: number;
  onChange: (newCanonicalValue: number) => void;
  preferredDisplayUnit?: WeightUnit;
}

export const UnitAwareInput = ({
  valueInCanonicalUnit,
  onChange,
  preferredDisplayUnit,
  className,
  ...rest
}: UnitAwareInputProps) => {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<WeightUnit>(
    preferredDisplayUnit ?? WEIGHT_UNITS.KG,
  );

  useEffect(() => {
    let targetUnit = preferredDisplayUnit ?? selectedUnit;

    if (!preferredDisplayUnit) {
      if (valueInCanonicalUnit >= WEIGHT_CONVERSIONS.ton) {
        targetUnit = WEIGHT_UNITS.TON;
      } else if (valueInCanonicalUnit >= WEIGHT_CONVERSIONS.kg) {
        targetUnit = WEIGHT_UNITS.KG;
      } else {
        targetUnit = WEIGHT_UNITS.G;
      }
    }

    const valueForDisplay = convertFromCanonical(
      valueInCanonicalUnit,
      targetUnit,
    );

    // Avoid displaying long decimals from conversion artifacts
    const roundedValue = parseFloat(valueForDisplay.toPrecision(10));

    setDisplayValue(String(roundedValue));
    setSelectedUnit(targetUnit);
  }, [valueInCanonicalUnit, preferredDisplayUnit]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayValue = e.target.value;
    setDisplayValue(newDisplayValue);
    const numericValue = parseFloat(newDisplayValue);
    if (!isNaN(numericValue)) {
      const newCanonicalValue = convertToCanonical(numericValue, selectedUnit);
      onChange(newCanonicalValue);
    } else {
      onChange(0);
    }
  };

  const handleUnitChange = (newUnit: WeightUnit) => {
    const currentNumericValue = parseFloat(displayValue);
    setSelectedUnit(newUnit);

    if (!isNaN(currentNumericValue)) {
      const newCanonicalValue = convertToCanonical(
        currentNumericValue,
        newUnit,
      );
      onChange(newCanonicalValue);
    } else {
      onChange(0);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Input
        type="number"
        value={displayValue}
        onChange={handleValueChange}
        className={className}
        step="any"
        {...rest}
      />
      <Select value={selectedUnit} onValueChange={handleUnitChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Unit" />
        </SelectTrigger>
        <SelectContent>
          {WEIGHT_UNIT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
