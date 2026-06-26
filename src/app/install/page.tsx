import { CheckCircle2, Database, Settings2, UserRound } from "lucide-react"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { InstallForm } from "@/features/install/components/install-form"
import { getInstallState } from "@/server/install/service"

export const dynamic = "force-dynamic"

export default async function InstallPage() {
  const installState = await getInstallState({ skipCache: true })

  if (installState.installed) {
    redirect("/")
  }

  const canInstall = installState.databaseReady

  return (
    <main className="page-shell grid place-items-center px-4 py-10">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <div className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-emerald-300">
            NextNews 安装向导
          </div>
          <h1 className="mt-8 text-3xl font-semibold leading-tight sm:text-4xl">
            首次访问时完成系统初始化
          </h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
            系统会自动创建数据库表、写入默认站点分类频道，并创建你的后台管理员账号。
          </p>

          <div className="mt-10 grid gap-4">
            <InstallStep
              active={installState.databaseReady}
              description={
                installState.databaseReady
                  ? "PostgreSQL 已可连接"
                  : "等待 PostgreSQL 或 DATABASE_URL"
              }
              icon={<Database className="h-5 w-5" />}
              title="检查数据库"
            />
            <InstallStep
              active={installState.migrated}
              description={
                installState.migrated
                  ? "数据库结构已存在"
                  : "提交表单后自动迁移"
              }
              icon={<Settings2 className="h-5 w-5" />}
              title="初始化表结构"
            />
            <InstallStep
              active={false}
              description="创建管理员并进入后台"
              icon={<UserRound className="h-5 w-5" />}
              title="设置管理员"
            />
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div>
            <p className="text-sm font-semibold text-emerald-600">Install</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              填写基础信息
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              这些信息以后可以在后台继续调整。安装完成后会自动登录管理员后台。
            </p>
          </div>

          {installState.error ? (
            <div
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              role="alert"
            >
              {installState.error}
            </div>
          ) : null}

          <div className="mt-8">
            <InstallForm
              defaultAdminEmail={
                process.env.ADMIN_EMAIL ?? "admin@nextnews.local"
              }
              defaultAppUrl={process.env.APP_URL ?? ""}
              disabled={!canInstall}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function InstallStep({
  active,
  description,
  icon,
  title,
}: {
  active: boolean
  description: string
  icon: ReactNode
  title: string
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-emerald-300">
        {active ? <CheckCircle2 className="h-5 w-5" /> : icon}
      </div>
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-sm leading-5 text-slate-400">
          {description}
        </div>
      </div>
    </div>
  )
}
