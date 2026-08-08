import { addDays, addMinutes, format, isValid, parseISO, startOfDay } from "date-fns";

export const APPOINTMENT_SLOT_TIMES = ["09:00", "11:00", "13:00", "15:00", "17:00"] as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export type AppointmentRequest = {
  date: string;
  time: string;
};

export function parseAppointmentRequest(input: unknown): AppointmentRequest | null {
  if (input == null || typeof input !== "object") {
    return null;
  }

  const data = input as Record<string, unknown>;
  const date = typeof data["date"] === "string" ? data["date"].trim() : "";
  const time = typeof data["time"] === "string" ? data["time"].trim() : "";

  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) {
    return null;
  }

  if (!APPOINTMENT_SLOT_TIMES.includes(time as (typeof APPOINTMENT_SLOT_TIMES)[number])) {
    return null;
  }

  return { date, time };
}

export function getAppointmentStartTime({ date, time }: AppointmentRequest) {
  const startTime = parseISO(`${date}T${time}:00`);

  if (!isValid(startTime)) {
    return null;
  }

  return startTime;
}

export function isPastAppointment(startTime: Date) {
  return startTime <= new Date();
}

export function getAppointmentEndTime(startTime: Date) {
  return addMinutes(startTime, 120);
}

export function getDayRange(date: string) {
  if (!DATE_PATTERN.test(date)) {
    return null;
  }

  const day = startOfDay(parseISO(`${date}T00:00:00`));

  if (!isValid(day)) {
    return null;
  }

  return {
    start: day,
    end: addDays(day, 1),
  };
}

export function getRemainingSlotTimes(date: string, bookedStartTimes: Date[]) {
  const booked = new Set(bookedStartTimes.map((startTime) => format(startTime, "HH:mm")));

  return APPOINTMENT_SLOT_TIMES.filter((time) => {
    const startTime = getAppointmentStartTime({ date, time });
    return startTime != null && !booked.has(time) && !isPastAppointment(startTime);
  });
}
