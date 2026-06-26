import Link from "next/link"
import { Shield } from "lucide-react"
import { LoginForm } from "@/features/auth/components/login-form"

export const metadata = {
  title: "后台登录",
}

export default function AdminLoginPage() {
  return (
    <main
      className="grid min-h-screen min-w-[320px] place-items-center bg-slate-100 px-4 py-10 text-slate-950"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255, 116, 116, 0.16), transparent 26rem), radial-gradient(circle at top right, rgba(39, 216, 133, 0.13), transparent 30rem), #f1f5f9",
      }}
    >
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="flex items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-3" href="/">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
              <Shield aria-hidden="true" size={20} strokeWidth={2} />
            </span>
            <span>
              <strong className="block font-serif text-2xl leading-none tracking-normal">
                NextNews
              </strong>
              <small className="mt-1 block text-xs text-slate-500">
                Admin Console
              </small>
            </span>
          </Link>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
            Admin
          </span>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
            后台入口
          </p>
          <h1 className="mt-2 font-serif text-[28px] font-semibold tracking-normal">
            登录管理后台
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
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
