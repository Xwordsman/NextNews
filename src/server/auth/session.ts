import { createHmac, timingSafeEqual } from "crypto"
import { and, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getDb } from "@/server/db/client"
import { sysUser } from "@/server/db/schema"
import { ADMIN_SESSION_COOKIE, USER_SESSION_COOKIE } from "./constants"

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

type SessionRole = "admin" | "user"

type SessionPayload = {
  userId: string
  email: string
  role: SessionRole
  expiresAt: number
}

export type CurrentAdminUser = {
  id: string
  email: string
  displayName: string
  role: SessionRole
}

export type CurrentUser = {
  id: string
  email: string
  displayName: string
  role: SessionRole
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production")
  }

  return secret ?? "nextnews-dev-secret"
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a)
  const bBuffer = Buffer.from(b)

  if (aBuffer.length !== bBuffer.length) {
    return false
  }

  return timingSafeEqual(aBuffer, bBuffer)
}

function createSessionToken(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${body}.${sign(body)}`
}

function parseSessionToken(
  token: string,
  expectedRole: SessionRole,
): SessionPayload | null {
  const [body, signature] = token.split(".")

  if (!body || !signature || !safeEqual(signature, sign(body))) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload

    if (!payload.userId || payload.role !== expectedRole) {
      return null
    }

    if (payload.expiresAt <= Date.now()) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

async function setSession(
  cookieName: string,
  payload: Omit<SessionPayload, "expiresAt">,
) {
  const cookieStore = await cookies()
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const token = createSessionToken({
    ...payload,
    expiresAt,
  })

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function setAdminSession(user: CurrentAdminUser) {
  await setSession(ADMIN_SESSION_COOKIE, {
    userId: user.id,
    email: user.email,
    role: "admin",
  })
}

export async function clearAdminSession() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return parseSessionToken(token, "admin")
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const session = await getAdminSession()

  if (!session) {
    return null
  }

  const db = getDb()
  const [user] = await db
    .select({
      id: sysUser.id,
      email: sysUser.email,
      displayName: sysUser.displayName,
      role: sysUser.role,
    })
    .from(sysUser)
    .where(
      and(
        eq(sysUser.id, session.userId),
        eq(sysUser.role, "admin"),
        eq(sysUser.status, "active"),
      ),
    )
    .limit(1)

  return user ?? null
}

export async function requireAdmin() {
  const user = await getCurrentAdminUser()

  if (!user) {
    redirect("/admin/login")
  }

  return user
}

export async function setUserSession(user: CurrentUser) {
  await setSession(USER_SESSION_COOKIE, {
    userId: user.id,
    email: user.email,
    role: "user",
  })
}

export async function clearUserSession() {
  const cookieStore = await cookies()
  cookieStore.delete(USER_SESSION_COOKIE)
}

export async function getUserSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(USER_SESSION_COOKIE)?.value

  if (!token) {
    return null
  }

  return parseSessionToken(token, "user")
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getUserSession()

  if (!session) {
    return null
  }

  const db = getDb()
  const [user] = await db
    .select({
      id: sysUser.id,
      email: sysUser.email,
      displayName: sysUser.displayName,
      role: sysUser.role,
    })
    .from(sysUser)
    .where(
      and(
        eq(sysUser.id, session.userId),
        eq(sysUser.role, "user"),
        eq(sysUser.status, "active"),
      ),
    )
    .limit(1)

  return user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
