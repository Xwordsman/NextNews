"use client"

import Link from "next/link"
import { useActionState } from "react"
import {
  userLoginAction,
  userRegisterAction,
  type UserAuthActionState,
} from "@/features/user-auth/actions"

const initialState: UserAuthActionState = {
  error: undefined,
}

export function UserLoginForm() {
  const [state, formAction, isPending] = useActionState(
    userLoginAction,
    initialState,
  )

  return (
    <form action={formAction} className="grid gap-4">
      <TextField autoComplete="email" label="邮箱" name="email" type="email" />
      <TextField
        autoComplete="current-password"
        label="密码"
        name="password"
        type="password"
      />
      <AuthError message={state.error} />
      <button
        className="min-h-11 cursor-pointer rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-500"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "登录中" : "登录个人中心"}
      </button>
      <p className="text-center text-sm text-slate-500">
        还没有账号？{" "}
        <Link
          className="font-semibold text-slate-950 underline-offset-4 hover:underline"
          href="/register"
        >
          创建一个
        </Link>
      </p>
    </form>
  )
}

export function UserRegisterForm() {
  const [state, formAction, isPending] = useActionState(
    userRegisterAction,
    initialState,
  )

  return (
    <form action={formAction} className="grid gap-4">
      <TextField
        autoComplete="name"
        label="昵称"
        name="displayName"
        required={false}
        type="text"
      />
      <TextField autoComplete="email" label="邮箱" name="email" type="email" />
      <TextField
        autoComplete="new-password"
        label="密码"
        minLength={8}
        name="password"
        type="password"
      />
      <AuthError message={state.error} />
      <button
        className="min-h-11 cursor-pointer rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-500"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "创建中" : "创建账号"}
      </button>
      <p className="text-center text-sm text-slate-500">
        已经有账号？{" "}
        <Link
          className="font-semibold text-slate-950 underline-offset-4 hover:underline"
          href="/login"
        >
          去登录
        </Link>
      </p>
    </form>
  )
}

function TextField({
  autoComplete,
  label,
  minLength,
  name,
  required = true,
  type,
}: {
  autoComplete: string
  label: string
  minLength?: number
  name: string
  required?: boolean
  type: string
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <input
        autoComplete={autoComplete}
        className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500"
        id={name}
        minLength={minLength}
        name={name}
        required={required}
        type={type}
      />
    </div>
  )
}

function AuthError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
      role="alert"
    >
      {message}
    </p>
  )
}
