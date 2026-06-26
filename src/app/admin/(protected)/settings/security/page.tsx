import {
  AdminAlert,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  RunButton,
} from "@/features/admin-content/components/admin-ui"
import { changeAdminPasswordAction } from "@/features/admin-content/actions"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"
import { requireAdmin } from "@/server/auth/session"
import { serverEnv } from "@/server/env"

export const dynamic = "force-dynamic"

export default async function AdminSecuritySettingsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [admin, errorMessage, noticeMessage] = await Promise.all([
    requireAdmin(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])
  const checks = [
    {
      label: "管理员账号",
      value: admin.email,
    },
    {
      label: "AUTH_SECRET",
      value: serverEnv.authSecret ? "已配置" : "未配置",
    },
    {
      label: "运行环境",
      value: process.env.NODE_ENV ?? "development",
    },
  ]

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="管理后台登录安全。当前版本先提供管理员改密和安全状态检查，后续可以继续扩展登录审计、二次验证和 IP 策略。"
        eyebrow="Security"
        title="后台安全"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <section className="grid gap-4 md:grid-cols-3">
        {checks.map((item) => (
          <article
            className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm"
            key={item.label}
          >
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 break-all text-lg font-semibold">{item.value}</p>
          </article>
        ))}
      </section>

      <AdminSection>
        <form action={changeAdminPasswordAction} className="grid gap-4 p-5">
          <input name="backTo" type="hidden" value="/admin/settings/security" />
          <div>
            <h2 className="text-base font-semibold">修改管理员密码</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              新密码至少 10 个字符。修改成功后会写入后台操作日志。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              当前密码
              <input
                className={inputClassName}
                name="currentPassword"
                type="password"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              新密码
              <input
                className={inputClassName}
                name="newPassword"
                type="password"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              确认新密码
              <input
                className={inputClassName}
                name="confirmPassword"
                type="password"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <RunButton label="更新密码" />
          </div>
        </form>
      </AdminSection>
    </div>
  )
}

const inputClassName =
  "min-h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
