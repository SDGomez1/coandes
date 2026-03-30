import { endOfDay, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export function toLocalCalendarDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toLocalDayTimestamp(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  ).getTime();
}

export function formatDateLabel(date: Date): string {
  return format(toLocalCalendarDate(date), "PPP", { locale: es });
}

export function formatDateRangeLabel(from?: Date, to?: Date): string {
  if (!from) {
    return "Seleccionar rango";
  }

  if (!to) {
    return `Desde ${formatDateLabel(from)}`;
  }

  return `${formatDateLabel(from)} - ${formatDateLabel(to)}`;
}

export function isDateInRange(target: number, from?: Date, to?: Date): boolean {
  if (!from) {
    return true;
  }

  const targetDate = new Date(target);
  const rangeStart = startOfDay(toLocalCalendarDate(from));
  const rangeEnd = endOfDay(toLocalCalendarDate(to ?? from));

  return targetDate >= rangeStart && targetDate <= rangeEnd;
}
