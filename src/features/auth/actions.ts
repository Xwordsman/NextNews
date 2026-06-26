"use server"

import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { verifyPassword } from "@/server/auth/password"
import { clearAdminSession, setAdminSession } from "@/server/auth/session"
import { getDb } from "@/server/db/client"
import { sysUser } from "@/server/db/schema"

export type LoginActionState = {
  error?: string
}

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "请输入邮箱和密码" }
  }

  const db = getDb()
  const [user] = await db
    .select()
    .from(sysUser)
    .where(
      and(
        eq(sysUser.email, email),
        eq(sysUser.role, "admin"),
        eq(sysUser.status, "active"),
      ),
    )
    .limit(1)

  if (!user) {
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

  await setAdminSession({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  })

  redirect("/admin")
}

export async function logoutAction() {
  await clearAdminSession()
  redirect("/admin/login")
}
