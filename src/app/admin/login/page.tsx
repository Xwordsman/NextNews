import Link from "next/link"
import { Shield } from "lucide-react"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata = {
  title: "后台登录",
}

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-screen min-w-[320px] place-items-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
              <Shield aria-hidden="true" size={20} strokeWidth={2} />
            </span>
            <span>
              <strong className="block text-2xl font-semibold leading-none tracking-normal">
                NextNews
              </strong>
              <small className="mt-1 block text-xs text-zinc-500">
                Admin Console
              </small>
            </span>
          </Link>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
            Admin
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
            后台入口
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-normal">
            登录管理后台
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            仅项目管理员可访问站点、分类、频道和抓取配置。
          </p>
        </div>
        <div className="mt-7">
          <LoginForm />
        </div>
      </section>
    </main>
  )
}
