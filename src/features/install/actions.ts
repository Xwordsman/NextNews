"use server"

import { redirect } from "next/navigation"
import { setAdminSession } from "@/server/auth/session"
import { installApplication, getInstallState } from "@/server/install/service"

export type InstallActionState = {
  error?: string
  fieldErrors?: Partial<
    Record<
      "appName" | "appUrl" | "adminEmail" | "adminPassword" | "confirmPassword",
      string
    >
  >
}

export async function installAction(
  _previousState: InstallActionState,
  formData: FormData,
): Promise<InstallActionState> {
  const appName = getFormString(formData, "appName")
  const appUrl = getFormString(formData, "appUrl")
  const adminEmail = getFormString(formData, "adminEmail").toLowerCase()
  const adminPassword = getFormString(formData, "adminPassword")
  const confirmPassword = getFormString(formData, "confirmPassword")

  const fieldErrors: InstallActionState["fieldErrors"] = {}

  if (appName.length < 2 || appName.length > 60) {
    fieldErrors.appName = "网站名称需要为 2 到 60 个字符。"
  }

  if (!isValidHttpUrl(appUrl)) {
    fieldErrors.appUrl = "请输入完整网址，例如 http://1.2.3.4:3040。"
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    fieldErrors.adminEmail = "请输入有效的管理员邮箱。"
  }

  if (adminPassword.length < 10) {
    fieldErrors.adminPassword = "管理员密码至少需要 10 个字符。"
  }

  if (confirmPassword !== adminPassword) {
    fieldErrors.confirmPassword = "两次输入的管理员密码不一致。"
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors }
  }

  const state = await getInstallState({ skipCache: true })

  if (state.installed) {
    redirect("/admin")
  }

  if (!state.databaseReady) {
    return {
      error: state.error ?? "数据库暂时不可用，请检查 PostgreSQL 容器。",
    }
  }

  let admin: Awaited<ReturnType<typeof installApplication>>["admin"]

  try {
    const result = await installApplication({
      appName,
      appUrl,
      adminEmail,
      adminPassword,
    })
    admin = result.admin
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? `安装失败：${error.message}`
          : "安装失败，请查看 web 容器日志。",
    }
  }

  await setAdminSession({
    id: admin.id,
    email: admin.email,
    displayName: admin.displayName,
    role: "admin",
  })

  redirect("/admin")
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}
