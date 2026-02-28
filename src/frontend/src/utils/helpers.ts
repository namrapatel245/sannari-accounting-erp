import {
  endOfMonth,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

export function formatCurrency(amount: number): string {
  if (Number.isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}

export function getTodayStr(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function generateBillNumber(
  prefix: string,
  existingBills: string[],
): string {
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let maxNum = 0;
  for (const bill of existingBills) {
    const match = bill.match(pattern);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${prefix}-${year}-${String(maxNum + 1).padStart(4, "0")}`;
}

export function getMonthName(monthIndex: number): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[monthIndex] || "";
}

export function getLast6Months(): Array<{
  month: number;
  year: number;
  label: string;
}> {
  const result: Array<{ month: number; year: number; label: string }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    result.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      label: format(d, "MMM yyyy"),
    });
  }
  return result;
}

export function getLast12Months(): Array<{
  month: number;
  year: number;
  label: string;
}> {
  const result: Array<{ month: number; year: number; label: string }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    result.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      label: format(d, "MMM yyyy"),
    });
  }
  return result;
}

export function isInMonth(
  dateStr: string,
  month: number,
  year: number,
): boolean {
  try {
    const d = parseISO(dateStr);
    return d.getMonth() === month && d.getFullYear() === year;
  } catch {
    return false;
  }
}

export function isInCurrentMonth(dateStr: string): boolean {
  const now = new Date();
  return isInMonth(dateStr, now.getMonth(), now.getFullYear());
}

export function isInDateRange(
  dateStr: string,
  from: string,
  to: string,
): boolean {
  if (!from && !to) return true;
  try {
    const d = parseISO(dateStr);
    if (from && to) {
      return isWithinInterval(d, { start: parseISO(from), end: parseISO(to) });
    }
    if (from) return d >= parseISO(from);
    if (to) return d <= parseISO(to);
    return true;
  } catch {
    return true;
  }
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getStartOfMonth(date: Date): Date {
  return startOfMonth(date);
}

export function getEndOfMonth(date: Date): Date {
  return endOfMonth(date);
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
