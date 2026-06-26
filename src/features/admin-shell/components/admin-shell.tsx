import Link from "next/link"
import type { ReactNode } from "react"
import { ExternalLink, LogOut, Shield } from "lucide-react"
import { logoutAction } from "@/features/auth/actions"
import type { CurrentAdminUser } from "@/server/auth/session"
import { adminNavigation } from "../navigation"

type AdminShellProps = {
  admin: CurrentAdminUser
  children: ReactNode
}

export function AdminShell({ admin, children }: AdminShellProps) {
  return (
    <main
      className="min-h-screen min-w-[320px] bg-slate-100 text-slate-950"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255, 116, 116, 0.16), transparent 26rem), radial-gradient(circle at top right, rgba(39, 216, 133, 0.13), transparent 30rem), #f1f5f9",
      }}
    >
      <div className="mx-auto grid min-h-screen w-full max-w-[1720px] gap-5 px-6 py-6 max-sm:px-3 max-sm:py-3 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-auto">
          <div className="flex min-h-20 items-center justify-between gap-3 border-b border-slate-200 px-5">
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
          <nav aria-label="后台菜单" className="grid gap-5 p-5">
            {adminNavigation.map((group) => (
              <section key={group.title}>
                <h2 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                  {group.title}
                </h2>
                <div className="mt-2 grid gap-1">
                  {group.items.map((item) => (
                    <Link
                      className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-900/10 hover:text-slate-950 focus-visible:bg-slate-900/10 focus-visible:text-slate-950 focus-visible:outline-none"
                      href={item.href}
                      key={item.href}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-6 z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 shadow-sm backdrop-blur-xl max-sm:top-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
                Operations
              </p>
              <h1 className="mt-1 font-serif text-2xl font-semibold tracking-normal">
                内容源控制台
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm font-medium text-slate-500 sm:inline">
                {admin.displayName}
              </span>
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-900 hover:text-white"
                href="/"
              >
                <ExternalLink aria-hidden="true" size={16} />
                前台
              </Link>
              <form action={logoutAction}>
                <button
                  className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-black"
                  type="submit"
                >
                  <LogOut aria-hidden="true" size={16} />
                  退出
                </button>
              </form>
            </div>
          </header>
          <div className="py-5 md:py-6">{children}</div>
        </section>
      </div>
    </main>
  )
}
