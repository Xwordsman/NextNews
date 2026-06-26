import { randomBytes, scryptSync, timingSafeEqual } from "crypto"

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")

  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password: string, passwordHash: string) {
  const [scheme, salt, hash] = passwordHash.split("$")

  if (scheme !== "scrypt" || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, "hex")
  const actual = scryptSync(password, salt, expected.length)

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}
