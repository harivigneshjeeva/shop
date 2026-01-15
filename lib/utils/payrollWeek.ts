import { addDays, startOfDay } from 'date-fns';

/**
 * Get the start of payroll week based on custom start day
 * @param date - Any date within the week
 * @param weekStartDay - Day of week (0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday)
 */
export function getPayrollWeekStart(date: Date, weekStartDay: number = 5): Date {
  const day = date.getDay();
  let diff = day - weekStartDay;
  
  if (diff < 0) {
    diff += 7;
  }
  
  return startOfDay(addDays(date, -diff));
}

/**
 * Get the end of payroll week (6 days after start)
 * @param date - Any date within the week
 * @param weekStartDay - Day of week (0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday)
 */
export function getPayrollWeekEnd(date: Date, weekStartDay: number = 5): Date {
  const weekStart = getPayrollWeekStart(date, weekStartDay);
  return startOfDay(addDays(weekStart, 6));
}

/**
 * Get day name from day number
 */
export function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

/**
 * Get end day name based on start day
 */
export function getEndDayName(startDay: number): string {
  return getDayName((startDay + 6) % 7);
}
