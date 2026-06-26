"use client"

import { useActionState } from "react"
import { loginAction, type LoginActionState } from "@/features/auth/actions"

const initialState: LoginActionState = {
  error: undefined,
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  )

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="email">
          邮箱
        </label>
        <input
          autoComplete="username"
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-base outline-none transition-colors focus:border-blue-500"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="password">
          密码
        </label>
        <input
          autoComplete="current-password"
          className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-base outline-none transition-colors focus:border-blue-500"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {state.error ? (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <button
        className="min-h-11 cursor-pointer rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-500"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "登录中" : "登录后台"}
      </button>
    </form>
  )
}
