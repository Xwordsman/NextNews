import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { getAdminSystemOperations } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminSystemOperationsPage() {
  const data = await getAdminSystemOperations()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="查看后台关键操作日志和系统任务队列状态。队列当前是预留能力，后续可接入 Redis 或数据库任务消费。"
        eyebrow="System"
        title="操作日志与任务队列"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.jobCounts.length === 0 ? (
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">任务队列</p>
            <p className="mt-3 text-3xl font-semibold">0</p>
            <p className="mt-2 text-sm text-slate-500">暂无任务</p>
          </article>
        ) : (
          data.jobCounts.map((item) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm"
              key={item.status}
            >
              <p className="text-sm font-medium text-slate-500">
                {item.status}
              </p>
              <p className="mt-3 text-3xl font-semibold">{item.value}</p>
              <p className="mt-2 text-sm text-slate-500">任务数量</p>
            </article>
          ))
        )}
      </section>

      <AdminSection>
        {data.operationLogs.length === 0 ? (
          <AdminEmptyState
            description="保存业务设置、会员套餐、日报模板等操作会写入这里。"
            title="暂无操作日志"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">动作</th>
                <th className="px-5 py-3">对象</th>
                <th className="px-5 py-3">摘要</th>
                <th className="px-5 py-3">管理员</th>
                <th className="px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.operationLogs.map((log) => (
                <tr className="hover:bg-slate-50/80" key={log.id}>
                  <td className="px-5 py-4 font-mono text-xs font-semibold">
                    {log.action}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {log.targetType ?? "-"}
                    {log.targetId ? (
                      <span className="mt-1 block font-mono text-xs">
                        {log.targetId}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {log.summary ?? "-"}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {log.adminName ?? "系统"}
                    {log.adminEmail ? (
                      <>
                        <br />
                        {log.adminEmail}
                      </>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {data.jobs.length === 0 ? (
          <AdminEmptyState
            description="开启异步任务队列后，通知、日报、统计等派生任务可以写入这里。"
            title="暂无队列任务"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">任务</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">重试</th>
                <th className="px-5 py-3">时间</th>
                <th className="px-5 py-3">错误</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.jobs.map((job) => (
                <tr className="hover:bg-slate-50/80" key={job.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{job.jobType}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {job.id}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {job.attempts} / {job.maxAttempts}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    创建：{formatDateTime(job.createdAt)}
                    <br />
                    可执行：{formatDateTime(job.availableAt)}
                    <br />
                    完成：{formatDateTime(job.finishedAt)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {job.errorMessage ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>
    </div>
  )
}
