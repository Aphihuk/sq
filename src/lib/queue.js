// Shared queue helpers used across API routes.

export const AVG_SERVICE_MINUTES = 5;

export function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatQueueNumber(prefix, sequence) {
  return `${prefix}${String(sequence).padStart(3, "0")}`;
}

export function estimateWaitMinutes(positionAhead) {
  return Math.max(0, positionAhead) * AVG_SERVICE_MINUTES;
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
