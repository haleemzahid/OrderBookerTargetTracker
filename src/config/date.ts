/**
 * Date utility functions using date-fns
 * This file provides common date utilities that can replace dayjs functionality
 */

import { format as formatDate, isValid, getYear, getMonth } from 'date-fns';

/**
 * Format a date using the specified format string
 * 
 * @param date The date to format
 * @param formatStr The format string
 * @returns Formatted date string
 */
export function format(date: Date | number, formatStr: string = 'MMM yyyy'): string {
  if (!date) return '';
  if (!isValid(date)) return '';
  return formatDate(date, formatStr);
}

/**
 * Create a date object for the specified year and month
 * 
 * @param year The year
 * @param month The month (1-12)
 * @returns Date object
 */
export function createYearMonth(year: number, month: number): Date {
  // month in date-fns is 0-indexed, but we use 1-indexed in our app
  return new Date(year, month - 1, 1);
}

/**
 * Get the year from a date
 * 
 * @param date The date
 * @returns The year
 */
export function getDateYear(date: Date): number {
  return getYear(date);
}

/**
 * Get the month from a date (1-12)
 * 
 * @param date The date
 * @returns The month (1-12)
 */
export function getDateMonth(date: Date): number {
  // getMonth returns 0-11, but we use 1-12 in our app
  return getMonth(date) + 1;
}

/**
 * Create a date object for the current date
 * 
 * @returns Current date
 */
export function now(): Date {
  return new Date();
}

/**
 * Check if a date is valid
 * 
 * @param date The date to check
 * @returns True if date is valid
 */
export function validateDate(date: any): boolean {
  return isValid(date);
}

export default {
  format,
  createYearMonth,
  getDateYear,
  getDateMonth,
  now,
  validateDate,
  isValid,
};
