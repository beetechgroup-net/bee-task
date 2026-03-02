import { isWeekend, startOfDay } from "date-fns";
import { HOLIDAYS_2026 } from "./holidays";

/**
 * Calculates the total working days within an interval.
 * Excludes weekends and configured holidays.
 */
export const getWorkingDaysInInterval = (start: Date, end: Date): number => {
  let workingDays = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const endCompare = startOfDay(end).getTime();

  while (current.getTime() <= endCompare) {
    if (!isWeekend(current)) {
      const dateStr = current.toISOString().split("T")[0];
      const isHoliday = HOLIDAYS_2026.some(
        (h) => h.date === dateStr && h.type === "Feriado",
      );

      if (!isHoliday) {
        workingDays++;
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
};

/**
 * Calculates the expected capacity in milliseconds for a given interval and daily work hours.
 */
export const calculateCapacityInMs = (
  start: Date,
  end: Date,
  dailyWorkHours: number,
): number => {
  if (!dailyWorkHours || dailyWorkHours <= 0) return 0;

  const workingDays = getWorkingDaysInInterval(start, end);
  return workingDays * dailyWorkHours * 60 * 60 * 1000;
};

/**
 * Calculates the total duration worked (in ms) within a specific time interval,
 * given a list of task logs.
 */
export const calculateDurationInInterval = (
  logs: { startTime: number; endTime?: number }[],
  rangeStart: number,
  rangeEnd: number,
): number => {
  return logs.reduce((acc, log) => {
    const logStart = log.startTime;
    const logEnd = log.endTime || Date.now(); // If running, assume now

    // Check for overlap
    if (logStart < rangeEnd && logEnd > rangeStart) {
      const effectiveStart = Math.max(logStart, rangeStart);
      const effectiveEnd = Math.min(logEnd, rangeEnd);
      return acc + (effectiveEnd - effectiveStart);
    }
    return acc;
  }, 0);
};
