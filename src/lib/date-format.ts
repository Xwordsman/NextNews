export const APP_TIME_ZONE = "Asia/Shanghai"

export function formatAppDateTime(
  value: Date | string | null | undefined,
  fallback = "未产生",
) {
  if (!value) {
    return fallback
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(date)
}

export function formatAppDateTimeWithSeconds(
  value: Date | string | null | undefined,
  fallback = "",
) {
  if (!value) {
    return fallback
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: APP_TIME_ZONE,
    year: "numeric",
  }).format(date)
}
