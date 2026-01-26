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
}

export const UnitAwareInput = ({
  valueInCanonicalUnit,
  onChange,
  className,
  ...rest
}: UnitAwareInputProps) => {
  const [displayValue, setDisplayValue] = useState<string>("");

  useEffect(() => {
    const valueForDisplay = convertFromCanonical(
      valueInCanonicalUnit,
      WEIGHT_UNITS.KG,
    );

    // Avoid displaying long decimals from conversion artifacts
    const roundedValue = parseFloat(valueForDisplay.toPrecision(10));

    setDisplayValue(String(roundedValue));
  }, [valueInCanonicalUnit]);

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDisplayValue = e.target.value;
    setDisplayValue(newDisplayValue);
    const numericValue = parseFloat(newDisplayValue);
    if (!isNaN(numericValue)) {
      const newCanonicalValue = convertToCanonical(numericValue, WEIGHT_UNITS.KG);
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
      <span>kg</span>
    </div>
  );
};
