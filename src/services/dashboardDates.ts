export type Granularity = "day" | "week" | "month";

// Calendar labels in the requested zone avoid fixed-duration arithmetic across DST.
export function bucketLabel(date: Date, tz: string, granularity: Granularity): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const day = new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
  if (granularity === "month") day.setUTCDate(1);
  if (granularity === "week") day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

export function bucketLabels(from: Date, to: Date, tz: string, granularity: Granularity): string[] {
  const end = bucketLabel(to, tz, granularity);
  const cursor = new Date(`${bucketLabel(from, tz, granularity)}T00:00:00Z`);
  const labels: string[] = [];
  while (cursor.toISOString().slice(0, 10) <= end && labels.length <= 366) {
    labels.push(cursor.toISOString().slice(0, 10));
    if (granularity === "month") cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + (granularity === "week" ? 7 : 1));
  }
  return labels;
}

/** Resolve the first instant of a local calendar date, including midnight DST transitions. */
export function startOfLocalDate(label: string, tz: string): Date {
  const target = Date.parse(`${label}T00:00:00.000Z`);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const localTime = (time: number) => {
    const parts = formatter.formatToParts(new Date(time));
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    );
  };
  // Sample offsets around the boundary to account for transitions and repeated midnight.
  const candidates: number[] = [];
  for (let hours = -48; hours <= 48; hours += 6) {
    const sample = target + hours * 3600000;
    candidates.push(target - (localTime(sample) - sample));
  }
  const after = candidates.filter((candidate) => localTime(candidate) >= target);
  if (!after.length) throw new RangeError("Invalid local date");
  let high = Math.min(...after);
  let low = high - 48 * 3600000;
  // Find the actual boundary if midnight falls in a clock-change gap.
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (localTime(mid) >= target) high = mid;
    else low = mid;
  }
  if (bucketLabel(new Date(high), tz, "day") !== label) throw new RangeError("Invalid local date");
  return new Date(high);
}

export function endOfLocalDate(label: string, tz: string): Date {
  startOfLocalDate(label, tz);
  const next = new Date(`${label}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  // A timezone can skip a whole civil date when its UTC offset changes.
  for (let i = 0; i < 3; i++) {
    try {
      return new Date(startOfLocalDate(next.toISOString().slice(0, 10), tz).getTime() - 1);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      next.setUTCDate(next.getUTCDate() + 1);
    }
  }
  throw new RangeError("Invalid local date");
}
