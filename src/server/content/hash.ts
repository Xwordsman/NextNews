import { createHash } from "crypto"

export function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function normalizeContentUrl(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim()

  if (!trimmed) {
    return ""
  }

  try {
    return new URL(trimmed).toString()
  } catch {
    return trimmed
  }
}

export function hashContentUrl(value: string) {
  return hashText(normalizeContentUrl(value))
}
