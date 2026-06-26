"use server"

import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { hashPassword, verifyPassword } from "@/server/auth/password"
import { clearUserSession, setUserSession } from "@/server/auth/session"
import { getDb } from "@/server/db/client"
import { sysUser } from "@/server/db/schema"

export type UserAuthActionState = {
  error?: string
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
}

function normalizePassword(value: FormDataEntryValue | null) {
  return String(value ?? "")
}

function normalizeDisplayName(value: FormDataEntryValue | null, email: string) {
  const displayName = String(value ?? "").trim()
  return displayName || email.split("@")[0] || "NextNews User"
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  )
}

export async function userLoginAction(
  _previousState: UserAuthActionState,
  formData: FormData,
): Promise<UserAuthActionState> {
  const email = normalizeEmail(formData.get("email"))
  const password = normalizePassword(formData.get("password"))

  if (!email || !password) {
    return { error: "请输入邮箱和密码" }
  }

  const db = getDb()
  const [user] = await db
    .select()
    .from(sysUser)
    .where(eq(sysUser.email, email))
    .limit(1)

  if (!user || user.status !== "active" || user.role !== "user") {
    return { error: "账号或密码不正确" }
  }

  const isValidPassword = verifyPassword(password, user.passwordHash)

  if (!isValidPassword) {
    return { error: "账号或密码不正确" }
  }

  const now = new Date()

  await db
    .update(sysUser)
    .set({
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(sysUser.id, user.id))

  await setUserSession({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  })

  redirect("/account")
}

export async function userRegisterAction(
  _previousState: UserAuthActionState,
  formData: FormData,
): Promise<UserAuthActionState> {
  const email = normalizeEmail(formData.get("email"))
  const password = normalizePassword(formData.get("password"))
  const displayName = normalizeDisplayName(formData.get("displayName"), email)

  if (!email || !password) {
    return { error: "请输入邮箱和密码" }
  }

  if (password.length < 8) {
    return { error: "密码至少需要 8 位" }
  }

  try {
    const now = new Date()
    const [user] = await getDb()
      .insert(sysUser)
      .values({
        email,
        passwordHash: hashPassword(password),
        displayName,
        role: "user",
        status: "active",
        lastLoginAt: now,
      })
      .returning({
        id: sysUser.id,
        email: sysUser.email,
        displayName: sysUser.displayName,
        role: sysUser.role,
      })

    await setUserSession(user)
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "这个邮箱已经注册过了" }
    }

    throw error
  }

  redirect("/account")
}

export async function userLogoutAction() {
  await clearUserSession()
  redirect("/")
}
