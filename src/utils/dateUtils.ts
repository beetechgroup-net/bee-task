import {
  format,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export const formatDate = (
  date: number | Date,
  formatStr: string = "MMM d, yyyy",
) => {
  return format(date, formatStr);
};

export const formatDuration = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
};

export const isSameDay = (d1: number, d2: number) => {
  return format(d1, "yyyy-MM-dd") === format(d2, "yyyy-MM-dd");
};

export {
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
};
