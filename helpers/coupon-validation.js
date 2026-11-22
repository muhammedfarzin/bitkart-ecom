import { localDate as couponDate, localTime as couponTime, parseLocalDate, addDays, endOfLocalDay } from "./date-time.js";
export { localDate as couponDate, localTime as couponTime } from "./date-time.js";
export const normalizeCouponCode = (value) =>
  typeof value === "string" ? value.replace(/\s/g, "").toUpperCase() : "";

export class CouponValidationError extends Error {
  constructor(errors) {
    super(Object.values(errors).join(" "));
    this.errors = errors;
  }
}

export function couponStatus(coupon, now = new Date()) {
  if (coupon.status === "deactivated") return "Deactivated";
  if (coupon.validUpto <= now) return "Expired";
  if (coupon.validFrom > now) return "Scheduled";
  return "Active";
}

export function validateCouponFields(data, current, now = new Date()) {
  const errors = {};
  const text = (name, max) => {
    const value = typeof data[name] === "string" ? data[name].trim() : "";
    if (!value || value.length > max) errors[name] = `Enter ${name} (1–${max} characters).`;
    return value;
  };
  const title = text("title", 100);
  const description = text("description", 300);
  const code = normalizeCouponCode(data.code);
  if (!/^[A-Z0-9_-]{1,32}$/.test(code)) errors.code = "Use 1–32 letters, numbers, hyphens or underscores for the code.";
  const discountType = data.discountType;
  if (!["flat", "percentage"].includes(discountType)) errors.discountType = "Choose flat or percentage.";
  const number = (name, min, max = 1000000000) => {
    const raw = data[name];
    const value = typeof raw === "number" || (typeof raw === "string" && raw.trim()) ? Number(raw) : NaN;
    if (!Number.isFinite(value) || value < min || value > max || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001)
      errors[name] = `Enter a value from ${min} to ${max}, with at most two decimal places.`;
    return value;
  };
  const discountValue = number("discountValue", 1, discountType === "percentage" ? 100 : 1000000000);
  const minPurchaseAmount = number("minPurchaseAmount", 10);
  const maxDiscountAmount = discountType === "flat" ? discountValue : number("maxDiscountAmount", 1);
  const scheduled = data.schedule === "true" || data.schedule === "on" || data.schedule === true;
  const mode = scheduled ? data.startOption ?? "today" : "today";
  const today = couponDate(now);
  const day = mode === "today" ? today : mode === "tomorrow" ? addDays(today, 1) : data.validFrom;
  if (!["today", "tomorrow", "pick"].includes(mode)) errors.startOption = "Choose Today, Tomorrow or Pick a date.";
  const time = scheduled ? data.startTime || "00:00" : "00:00";
  let validFrom = parseLocalDate(day, time);
  const originalStart = current?.validFrom || current?.createdAt;
  const unchangedStart = originalStart && day === couponDate(originalStart) && time === couponTime(originalStart);
  if (unchangedStart) validFrom = originalStart;
  if (!scheduled) {
    const startDay = originalStart && originalStart <= now ? couponDate(originalStart) : today;
    validFrom = parseLocalDate(startDay, "00:00");
  }
  if (!validFrom) errors.validFrom = "Choose a valid start date and time.";
  else if (day < today && !unchangedStart) errors.validFrom = "Choose today or a future start date.";
  let validUpto = parseLocalDate(data.validUpto, "23:59");
  if (validUpto) validUpto = endOfLocalDay(data.validUpto);
  const unchangedEnd = current?.validUpto && data.validUpto === couponDate(current.validUpto);
  if (unchangedEnd) validUpto = current.validUpto;
  if (!validUpto) errors.validUpto = "Choose a valid expiry date.";
  else if (validUpto <= now && !unchangedEnd) errors.validUpto = "Choose today or a future expiry date.";
  if (validFrom && validUpto && validFrom >= validUpto) errors.validUpto = "Expiry must be after the start date and time.";
  const status = current?.status ?? "active";
  if (Object.keys(errors).length) throw new CouponValidationError(errors);
  return { title, description, code, discountType, discountValue, minPurchaseAmount, maxDiscountAmount, validFrom, validUpto, status };
}
