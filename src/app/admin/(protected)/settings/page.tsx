import {
  AdminAlert,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  RunButton,
} from "@/features/admin-content/components/admin-ui"
import { saveSystemSettingsAction } from "@/features/admin-content/actions"
import {
  getAdminSystemOverview,
  getAdminSystemSettings,
} from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"
import type { ReactNode } from "react"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [overview, settings, errorMessage, noticeMessage] = await Promise.all([
    getAdminSystemOverview(),
    getAdminSystemSettings(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看运行环境和频道定义，同时控制会员商业化、搜索日志、通知策略、日报自动化和队列预留等业务开关。"
        eyebrow="Settings"
        title="基础设置"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
        <AdminSection>
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">配置项</th>
                <th className="px-5 py-3">当前值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <SettingRow label="APP_URL" value={overview.appUrl} />
              <SettingRow label="NODE_ENV" value={overview.nodeEnv} />
              <SettingRow
                label="DATABASE_URL"
                value={
                  <BooleanBadge
                    active={overview.databaseConfigured}
                    activeLabel="已配置"
                    inactiveLabel="未配置"
                  />
                }
              />
              <SettingRow
                label="REDIS_URL"
                value={
                  <BooleanBadge
                    active={overview.redisConfigured}
                    activeLabel="已配置"
                    inactiveLabel="未配置"
                  />
                }
              />
              <SettingRow
                label="AUTH_SECRET"
                value={
                  <BooleanBadge
                    active={overview.authSecretConfigured}
                    activeLabel="已配置"
                    inactiveLabel="未配置"
                  />
                }
              />
              <SettingRow
                label="ADMIN_EMAIL"
                value={overview.adminEmail ?? "未配置"}
              />
              <SettingRow
                label="CRAWL_CONCURRENCY"
                value={String(overview.crawlConcurrency)}
              />
              <SettingRow
                label="CRAWL_DEFAULT_INTERVAL_SECONDS"
                value={String(overview.crawlDefaultIntervalSeconds)}
              />
              <SettingRow
                label="CRAWL_RUNNING_TIMEOUT_SECONDS"
                value={String(overview.crawlRunningTimeoutSeconds)}
              />
            </tbody>
          </AdminTable>
        </AdminSection>

        <AdminSection>
          <form action={saveSystemSettingsAction} className="grid gap-4 p-5">
            <input name="backTo" type="hidden" value="/admin/settings" />
            <div>
              <h2 className="text-base font-semibold">业务开关</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                这些开关默认保守启用或关闭。会员商业化默认关闭，不影响后台手动配置会员权益。
              </p>
            </div>
            <div className="grid gap-3">
              {settings.map((setting) => (
                <label
                  className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4"
                  key={setting.key}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{setting.label}</span>
                    <span className="font-mono text-xs text-slate-400">
                      {setting.key}
                    </span>
                  </span>
                  <span className="text-sm leading-6 text-slate-500">
                    {setting.description}
                  </span>
                  {setting.type === "boolean" ? (
                    <select
                      className={inputClassName}
                      defaultValue={setting.value}
                      name={setting.key}
                    >
                      <option value="true">开启</option>
                      <option value="false">关闭</option>
                    </select>
                  ) : (
                    <input
                      className={inputClassName}
                      defaultValue={setting.value}
                      min={0}
                      name={setting.key}
                      type="number"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <RunButton label="保存设置" />
            </div>
          </form>
        </AdminSection>
      </div>

      <AdminSection>
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          频道定义
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
          {overview.channelDefinitions.map((definition) => (
            <div
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              key={definition.key}
            >
              <div className="font-mono text-xs font-semibold text-slate-700">
                {definition.key}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {definition.defaults.name} / {definition.collectorType}
              </div>
            </div>
          ))}
        </div>
      </AdminSection>
    </div>
  )
}

const inputClassName =
  "min-h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"

function SettingRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-4 font-mono text-xs text-slate-500">{label}</td>
      <td className="px-5 py-4 text-sm text-slate-700">{value}</td>
    </tr>
  )
}
