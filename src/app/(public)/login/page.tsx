import Link from "next/link"
import { UserRound } from "lucide-react"
import { UserLoginForm } from "@/features/user-auth/components/user-auth-forms"

export const metadata = {
  title: "登录",
}

export default function UserLoginPage() {
  return (
    <main className="grid min-h-screen min-w-[320px] place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <Link
          className="inline-flex items-center gap-3 text-slate-950 no-underline"
          href="/"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-red-500 to-orange-400 text-white">
            <UserRound aria-hidden="true" size={20} strokeWidth={2} />
          </span>
          <span>
            <strong className="block font-serif text-2xl leading-none tracking-normal">
              NextNews
            </strong>
            <small className="mt-1 block text-xs text-slate-500">
              Reader Account
            </small>
          </span>
        </Link>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
            Account
          </p>
          <h1 className="mt-2 font-serif text-[28px] font-semibold tracking-normal">
            登录个人中心
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            登录后可以订阅频道，并在动态页查看自己关注的最新榜单。
          </p>
        </div>
        <div className="mt-7">
          <UserLoginForm />
        </div>
      </section>
    </main>
  )
}
