"use client";

import * as React from "react";
import {
  endOfMonth,
  startOfMonth,
  subDays,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
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

function rangesMatch(left?: DateRange, right?: DateRange) {
  const leftFrom = left?.from?.getTime();
  const leftTo = left?.to?.getTime();
  const rightFrom = right?.from?.getTime();
  const rightTo = right?.to?.getTime();

  return leftFrom === rightFrom && leftTo === rightTo;
}

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

  const triggerLabel = draftRange?.from
    ? formatDateRangeLabel(draftRange.from, draftRange.to)
    : placeholder;

  const helperText =
    draftRange?.from && !draftRange.to
      ? "Seleccione la fecha final para aplicar el rango."
      : "Seleccione la fecha inicial o use un rango rápido.";

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
            "w-full min-w-0 justify-between rounded-lg text-left font-normal sm:w-[420px] lg:w-[460px]",
            !draftRange?.from && "text-muted-foreground",
            className,
          )}
          title={triggerLabel}
        >
          <span className="truncate pr-2">{triggerLabel}</span>
          <CalendarIcon className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(100vw-1rem,44rem)] gap-0 overflow-hidden p-0 sm:w-auto"
        align="start"
      >
        <div className="border-b bg-muted/20 p-3">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {quickSelects.map((quickSelect) => {
              const isActive = rangesMatch(draftRange, quickSelect.range);

              return (
                <Button
                  key={quickSelect.label}
                  type="button"
                  size="sm"
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "justify-center rounded-full px-3 text-xs font-medium sm:text-sm",
                    isActive && "ring-1 ring-primary/20",
                  )}
                  onClick={() => applyCompletedRange(quickSelect.range)}
                >
                  {quickSelect.label}
                </Button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{helperText}</p>
        </div>
        <Calendar
          mode="range"
          locale={es}
          numberOfMonths={2}
          showOutsideDays={false}
          selected={draftRange}
          onDayClick={handleDayClick}
          disabled={(date) => toLocalCalendarDate(date) > today}
        />
      </PopoverContent>
    </Popover>
  );
}
