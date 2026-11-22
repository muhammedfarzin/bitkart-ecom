import { AsyncLocalStorage } from "node:async_hooks";
import moment from "moment";

const context = new AsyncLocalStorage();
export const getTimeZone = () => context.getStore() || "UTC";
export function validTimeZone(value) {
  try {
    if (typeof value !== "string" || value.length > 100) return "UTC";
    return new Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions().timeZone;
  } catch { return "UTC"; }
}
export const withTimeZone = (zone, callback) => context.run(validTimeZone(zone), callback);

function parts(value, zone = getTimeZone()) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value)).filter((part) => part.type !== "literal").map(({ type, value }) => [type, value]));
}
export function localDate(value = new Date(), zone = getTimeZone()) {
  const p = parts(value, zone);
  return `${p.year}-${p.month}-${p.day}`;
}
export function localTime(value, zone = getTimeZone()) {
  const p = parts(value, zone);
  return `${p.hour}:${p.minute}`;
}
export function addDays(day, count) {
  return moment.utc(day, "YYYY-MM-DD", true).add(count, "days").format("YYYY-MM-DD");
}
function offsetAt(value, zone) {
  const p = parts(value, zone);
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(+value / 1000) * 1000) / 60000;
}
export function formatDate(value = new Date(), format = "YYYY-MM-DD", zone = getTimeZone()) {
  // Calendar-only values are dates, not instants to shift across timezones.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return moment.utc(value).format(format);
  const date = new Date(value);
  if (!Number.isFinite(+date)) return "";
  return moment.utc(date).utcOffset(offsetAt(date, zone)).format(format);
}
export function parseLocalDate(day, time = "00:00", zone = getTimeZone()) {
  if (typeof day !== "string" || !moment.utc(day, "YYYY-MM-DD", true).isValid() ||
      typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const wall = Date.parse(`${day}T${time}:00Z`);
  // Try offsets on both sides of a clock change; repeated times use the earlier instant.
  const offsets = new Set([-2, -1, 0, 1, 2].map((days) => offsetAt(new Date(wall + days * 86400000), zone)));
  const matches = [...offsets].map((offset) => new Date(wall - offset * 60000))
    .filter((date) => localDate(date, zone) === day && localTime(date, zone) === time);
  return matches.length ? new Date(Math.min(...matches.map(Number))) : null;
}
export function startOfLocalDay(day) {
  const start = parseLocalDate(day);
  if (!start) throw new Error("Choose a valid date.");
  return start;
}
export function endOfLocalDay(day) {
  const next = parseLocalDate(addDays(day, 1));
  if (!next) throw new Error("Choose a valid date.");
  return new Date(+next - 1);
}

export function deviceTimeZone(req, res, next) {
  let zone;
  try {
    const cookie = (req.headers.cookie || "").split(";").map((item) => item.trim()).find((item) => item.startsWith("deviceTimeZone="));
    zone = cookie && decodeURIComponent(cookie.slice("deviceTimeZone=".length));
  } catch { /* Invalid cookies fall back to UTC. */ }
  withTimeZone(zone, () => {
    res.locals.deviceTimeZone = getTimeZone();
    next();
  });
}
