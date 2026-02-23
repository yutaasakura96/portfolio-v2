/**
 * Date formatting utilities with error handling
 */

import { format } from "date-fns";

/**
 * Safely format a date value to the specified format.
 * Returns a fallback string if the date is invalid.
 *
 * @param date - Date value to format (Date, string, or null)
 * @param formatStr - date-fns format string
 * @param fallback - Fallback string if date is invalid (default: "N/A")
 * @returns Formatted date string or fallback
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string,
  fallback = "N/A"
): string {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Failed to format date:", error);
    return fallback;
  }
}

/**
 * Format a date as "MMM yyyy" (e.g., "Jan 2023")
 */
export function formatMonthYear(date: Date | string | null | undefined): string {
  return formatDate(date, "MMM yyyy");
}

/**
 * Format a date as "yyyy" (e.g., "2023")
 */
export function formatYear(date: Date | string | null | undefined): string {
  return formatDate(date, "yyyy");
}

/**
 * Format a date range with start and optional end date.
 *
 * @param startDate - Start date
 * @param endDate - End date (null or undefined means "Present")
 * @param formatStr - date-fns format string
 * @returns Formatted date range string
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  formatStr = "MMM yyyy"
): string {
  const start = formatDate(startDate, formatStr);
  const end = endDate ? formatDate(endDate, formatStr) : "Present";
  return `${start} – ${end}`;
}
