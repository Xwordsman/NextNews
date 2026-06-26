"use client"

import { useActionState } from "react"
import {
  installAction,
  type InstallActionState,
} from "@/features/install/actions"

const initialState: InstallActionState = {
  error: undefined,
  fieldErrors: undefined,
}

export function InstallForm({
  defaultAdminEmail,
  defaultAppUrl,
  disabled,
}: {
  defaultAdminEmail: string
  defaultAppUrl: string
  disabled?: boolean
}) {
  const [state, formAction, isPending] = useActionState(
    installAction,
    initialState,
  )

  return (
    <form action={formAction} className="grid gap-5">
      <TextField
        autoComplete="organization"
        defaultValue="NextNews"
        error={state.fieldErrors?.appName}
        label="网站名称"
        name="appName"
        placeholder="NextNews"
        type="text"
      />
      <TextField
        autoComplete="url"
        defaultValue={defaultAppUrl}
        error={state.fieldErrors?.appUrl}
        label="网站网址"
        name="appUrl"
        placeholder="http://你的服务器IP:3040"
        type="url"
      />
      <TextField
        autoComplete="username"
        defaultValue={defaultAdminEmail}
        error={state.fieldErrors?.adminEmail}
        label="管理员邮箱"
        name="adminEmail"
        placeholder="admin@example.com"
        type="email"
      />
      <TextField
        autoComplete="new-password"
        error={state.fieldErrors?.adminPassword}
        label="管理员密码"
        minLength={10}
        name="adminPassword"
        placeholder="至少 10 个字符"
        type="password"
      />
      <TextField
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
        label="确认密码"
        minLength={10}
        name="confirmPassword"
        placeholder="再次输入管理员密码"
        type="password"
      />

      {state.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium leading-6 text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        className="min-h-11 cursor-pointer rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-500"
        disabled={disabled || isPending}
        type="submit"
      >
        {isPending ? "正在安装..." : "初始化并进入后台"}
      </button>
    </form>
  )
}

function TextField({
  autoComplete,
  defaultValue,
  error,
  label,
  minLength,
  name,
  placeholder,
  type,
}: {
  autoComplete: string
  defaultValue?: string
  error?: string
  label: string
  minLength?: number
  name: string
  placeholder: string
  type: string
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <input
        aria-describedby={error ? `${name}-error` : undefined}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500"
        defaultValue={defaultValue}
        id={name}
        minLength={minLength}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
      {error ? (
        <p className="text-sm leading-5 text-red-600" id={`${name}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
