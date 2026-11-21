export interface DaySchedule {
  isOpen: boolean;
  openTime: string; // "08:00"
  closeTime: string; // "17:00"
}

export type WeeklyHoursMap = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export interface LocationOverrideItem {
  id?: string;
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  note?: string | null;
}

export interface LocationItem {
  id: string;
  name: string;
  type: "STUDIO" | "MOBILE" | string;
  address: string;
  isActive: boolean;
  weeklyHours: WeeklyHoursMap;
  overrides: LocationOverrideItem[];
}

export const DAY_KEYS: (keyof WeeklyHoursMap)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<keyof WeeklyHoursMap, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DEFAULT_WEEKLY_HOURS: WeeklyHoursMap = {
  monday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
  tuesday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
  wednesday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
  thursday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
  friday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
  saturday: { isOpen: true, openTime: "08:00", closeTime: "17:00" },
  sunday: { isOpen: false, openTime: "09:00", closeTime: "15:00" },
};

function getDayKeyFromDate(dateStr: string): keyof WeeklyHoursMap {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return "monday";
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const jsDay = d.getDay(); // 0 = Sun, 1 = Mon...
  const map: (keyof WeeklyHoursMap)[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return map[jsDay] || "monday";
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatMinutes(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function generateTimeSlotsBetween(
  openTime: string,
  closeTime: string,
  stepMinutes = 60
): string[] {
  const start = parseMinutes(openTime);
  const end = parseMinutes(closeTime);
  if (end <= start) return [];

  const slots: string[] = [];
  let cursor = start;
  while (cursor + stepMinutes <= end) {
    slots.push(`${formatMinutes(cursor)} - ${formatMinutes(cursor + stepMinutes)}`);
    cursor += stepMinutes;
  }

  // If shorter window than 60 mins but still valid
  if (slots.length === 0 && end > start) {
    slots.push(`${formatMinutes(start)} - ${formatMinutes(end)}`);
  }

  return slots;
}

export function getLocationAvailabilityForDate(
  location: LocationItem,
  dateStr: string
): {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  slots: string[];
  reason?: string;
} {
  if (!location.isActive) {
    return {
      isOpen: false,
      openTime: "",
      closeTime: "",
      slots: [],
      reason: "This location is currently unavailable.",
    };
  }

  // 1. Check specific date override first (e.g. Tuesday closed or 11:00 - 16:00)
  const override = location.overrides?.find((o) => o.date === dateStr);
  if (override) {
    if (!override.isOpen) {
      return {
        isOpen: false,
        openTime: "",
        closeTime: "",
        slots: [],
        reason: override.note || "Closed on this selected date.",
      };
    }
    const open = override.openTime || "09:00";
    const close = override.closeTime || "17:00";
    return {
      isOpen: true,
      openTime: open,
      closeTime: close,
      slots: generateTimeSlotsBetween(open, close, 60),
      reason: override.note || undefined,
    };
  }

  // 2. Fallback to weekly operating schedule
  const dayKey = getDayKeyFromDate(dateStr);
  const weekly = (location.weeklyHours || DEFAULT_WEEKLY_HOURS) as WeeklyHoursMap;
  const daySched = weekly[dayKey] || DEFAULT_WEEKLY_HOURS[dayKey];

  if (!daySched || !daySched.isOpen) {
    return {
      isOpen: false,
      openTime: "",
      closeTime: "",
      slots: [],
      reason: `Closed on ${DAY_LABELS[dayKey]}s.`,
    };
  }

  return {
    isOpen: true,
    openTime: daySched.openTime,
    closeTime: daySched.closeTime,
    slots: generateTimeSlotsBetween(daySched.openTime, daySched.closeTime, 60),
  };
}
