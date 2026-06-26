import Link from "next/link"
import type { ReactNode } from "react"
import { ExternalLink, LogOut, Shield, UserCircle } from "lucide-react"
import { logoutAction } from "@/features/auth/actions"
import type { CurrentAdminUser } from "@/server/auth/session"
import { AdminSidebarNav } from "./admin-sidebar-nav"

type AdminShellProps = {
  admin: CurrentAdminUser
  children: ReactNode
}

export function AdminShell({ admin, children }: AdminShellProps) {
  return (
    <main className="min-h-screen min-w-[320px] bg-zinc-50 text-zinc-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-[276px] shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col">
          <div className="flex min-h-16 items-center gap-3 border-b border-zinc-200 px-4">
            <Link className="inline-flex min-w-0 items-center gap-3" href="/">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-sm">
                <Shield aria-hidden="true" size={19} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-lg font-semibold leading-none tracking-normal">
                  NextNews
                </strong>
                <small className="mt-1 block truncate text-xs text-zinc-500">
                  Admin Console
                </small>
              </span>
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-auto py-3">
            <AdminSidebarNav />
          </div>

          <div className="border-t border-zinc-200 p-4">
            <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-zinc-500 shadow-sm">
                <UserCircle aria-hidden="true" size={20} strokeWidth={2} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-950">
                  {admin.displayName}
                </span>
                <span className="mt-0.5 block text-xs text-zinc-500">
                  管理员
                </span>
              </span>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
            <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Link
                  className="inline-flex items-center gap-3 lg:hidden"
                  href="/admin"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-sm">
                    <Shield aria-hidden="true" size={19} strokeWidth={2} />
                  </span>
                </Link>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
                    Operations
                  </p>
                  <h1 className="mt-1 truncate text-lg font-semibold tracking-normal text-zinc-950 sm:text-xl">
                    内容源控制台
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-medium text-zinc-500 sm:inline">
                  {admin.displayName}
                </span>
                <Link
                  className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none"
                  href="/"
                >
                  <ExternalLink aria-hidden="true" size={16} />
                  前台
                </Link>
                <form action={logoutAction}>
                  <button
                    className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-zinc-950 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none"
                    type="submit"
                  >
                    <LogOut aria-hidden="true" size={16} />
                    退出
                  </button>
                </form>
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-zinc-50/70 lg:hidden">
              <div className="max-h-[46vh] overflow-auto px-2 py-3">
                <AdminSidebarNav />
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            <div className="mx-auto grid w-full max-w-[1440px] gap-6">
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
