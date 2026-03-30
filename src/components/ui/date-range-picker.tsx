"use client";

import * as React from "react";
import {
  endOfMonth,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateRangeLabel, toLocalCalendarDate } from "@/lib/date";

type DateRangePickerProps = {
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  className?: string;
};

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango",
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const today = toLocalCalendarDate(new Date());
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    value,
  );

  React.useEffect(() => {
    setDraftRange(value);
  }, [value]);

  const quickSelects = [
    {
      label: "Hoy",
      range: { from: today, to: today },
    },
    {
      label: "7 días",
      range: { from: subDays(today, 6), to: today },
    },
    {
      label: "30 días",
      range: { from: subDays(today, 29), to: today },
    },
    {
      label: "Este mes",
      range: { from: startOfMonth(today), to: today },
    },
    {
      label: "Mes pasado",
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
  ] as const;

  function applyCompletedRange(range: DateRange | undefined) {
    setDraftRange(range);
    onChange(range);
    setOpen(false);
  }

  function handleDayClick(day: Date) {
    const clickedDay = toLocalCalendarDate(day);

    if (!draftRange?.from || draftRange.to) {
      setDraftRange({ from: clickedDay, to: undefined });
      return;
    }

    if (clickedDay < draftRange.from) {
      setDraftRange({ from: clickedDay, to: undefined });
      return;
    }

    applyCompletedRange({ from: draftRange.from, to: clickedDay });
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setDraftRange(value);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between text-left font-normal md:w-[320px]",
            !draftRange?.from && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {draftRange?.from
              ? formatDateRangeLabel(draftRange.from, draftRange.to)
              : placeholder}
          </span>
          <CalendarIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-wrap gap-2 border-b p-2">
          {quickSelects.map((quickSelect) => (
            <Button
              key={quickSelect.label}
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => applyCompletedRange(quickSelect.range)}
            >
              {quickSelect.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={draftRange}
          onDayClick={handleDayClick}
          disabled={(date) => toLocalCalendarDate(date) > today}
        />
      </PopoverContent>
    </Popover>
  );
}
