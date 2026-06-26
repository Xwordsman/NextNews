import {
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
} from "@/features/admin-content/components/admin-ui"
import { getAdminSystemOverview } from "@/features/admin-content/queries"
import type { ReactNode } from "react"

export const dynamic = "force-dynamic"

export default function AdminSettingsPage() {
  const overview = getAdminSystemOverview()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看当前运行环境、关键环境变量和已注册频道定义。敏感值只显示是否已配置。"
        eyebrow="Settings"
        title="基础设置"
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.7fr)]">
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
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            频道定义
          </div>
          <div className="grid gap-3 p-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                已注册
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">
                {overview.channelDefinitionCount}
              </div>
            </div>
            <div className="grid gap-2">
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
          </div>
        </AdminSection>
      </div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="px-5 py-4 font-mono text-xs text-slate-500">{label}</td>
      <td className="px-5 py-4 text-sm text-slate-700">{value}</td>
    </tr>
  )
}
