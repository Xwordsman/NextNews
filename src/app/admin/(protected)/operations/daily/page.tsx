import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  RunButton,
  StatusBadge,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import {
  publishTodayDailyReportAction,
  saveDailyReportTemplateAction,
  updateDailyReportStatusAction,
} from "@/features/admin-content/actions"
import {
  listAdminDailyReportTemplates,
  listAdminDailyReports,
} from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminDailyOperationPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [reports, templates, errorMessage, noticeMessage] = await Promise.all([
    listAdminDailyReports(),
    listAdminDailyReportTemplates(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="日报由后台发布状态控制，前台展示最新 active 日报；模板用于后续 Worker 自动生成日报，也能先作为人工运营规则保存。"
        eyebrow="Operations"
        title="日报配置"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h2 className="text-base font-semibold">发布今日日报</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              发布后 `/daily` 会显示今天的日报标题，并聚合首页频道的最新内容。
            </p>
          </div>
          <form action={publishTodayDailyReportAction}>
            <input
              name="backTo"
              type="hidden"
              value="/admin/operations/daily"
            />
            <RunButton label="生成并发布" />
          </form>
        </div>
      </AdminSection>

      <AdminSection>
        <form action={saveDailyReportTemplateAction} className="grid gap-4 p-5">
          <input name="backTo" type="hidden" value="/admin/operations/daily" />
          <div>
            <h2 className="text-base font-semibold">新增日报模板</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              模板不会立刻触发自动生成；是否自动生成、是否需要审核由基础设置和模板本身共同控制。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className={inputClassName}
              name="templateName"
              placeholder="模板名称"
            />
            <input
              className={inputClassName}
              defaultValue="NextNews 日报 {date}"
              name="titlePattern"
              placeholder="标题模板"
            />
            <input
              className={inputClassName}
              defaultValue={8}
              min={1}
              name="channelLimit"
              placeholder="频道数"
              type="number"
            />
            <input
              className={inputClassName}
              defaultValue={5}
              min={1}
              name="itemLimitPerChannel"
              placeholder="每频道条目数"
              type="number"
            />
            <input
              className={inputClassName}
              defaultValue="09:00"
              name="scheduleTime"
              type="time"
            />
            <input
              className={inputClassName}
              defaultValue={0}
              name="sort"
              placeholder="排序"
              type="number"
            />
            <select
              className={inputClassName}
              defaultValue="active"
              name="status"
            >
              <option value="active">启用</option>
              <option value="draft">草稿</option>
              <option value="disabled">停用</option>
            </select>
            <select
              className={inputClassName}
              defaultValue="true"
              name="requireReview"
            >
              <option value="true">需要审核</option>
              <option value="false">直接发布</option>
            </select>
            <select
              className={inputClassName}
              defaultValue="false"
              name="autoPublish"
            >
              <option value="false">不自动发布</option>
              <option value="true">自动发布</option>
            </select>
          </div>
          <textarea
            className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
            name="summaryPattern"
            placeholder="摘要模板"
          />
          <div className="flex justify-end">
            <RunButton label="保存模板" />
          </div>
        </form>
      </AdminSection>

      <AdminSection>
        {templates.length === 0 ? (
          <AdminEmptyState
            description="保存模板后，后续 Worker 自动生成日报会读取这里的规则。"
            title="暂无日报模板"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">模板</th>
                <th className="px-5 py-3">策略</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">快速编辑</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {templates.map((template) => (
                <tr className="hover:bg-slate-50/80" key={template.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{template.templateName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {template.titlePattern}
                    </div>
                    {template.summaryPattern ? (
                      <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-500">
                        {template.summaryPattern}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {template.channelLimit} 个频道 / 每频道{" "}
                    {template.itemLimitPerChannel} 条
                    <br />
                    执行时间：{template.scheduleTime}
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid gap-2">
                      <StatusBadge status={template.status} />
                      <BooleanBadge
                        active={template.autoPublish}
                        activeLabel="自动发布"
                        inactiveLabel="人工发布"
                      />
                      <BooleanBadge
                        active={template.requireReview}
                        activeLabel="需要审核"
                        inactiveLabel="无需审核"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <form
                      action={saveDailyReportTemplateAction}
                      className="grid min-w-[520px] gap-2"
                    >
                      <input name="id" type="hidden" value={template.id} />
                      <input
                        name="backTo"
                        type="hidden"
                        value="/admin/operations/daily"
                      />
                      <div className="grid gap-2 md:grid-cols-3">
                        <input
                          className={inputClassName}
                          defaultValue={template.templateName}
                          name="templateName"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={template.titlePattern}
                          name="titlePattern"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={template.scheduleTime}
                          name="scheduleTime"
                          type="time"
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          className={inputClassName}
                          defaultValue={template.channelLimit}
                          min={1}
                          name="channelLimit"
                          type="number"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={template.itemLimitPerChannel}
                          min={1}
                          name="itemLimitPerChannel"
                          type="number"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={template.sort}
                          name="sort"
                          type="number"
                        />
                        <select
                          className={inputClassName}
                          defaultValue={template.status}
                          name="status"
                        >
                          <option value="active">启用</option>
                          <option value="draft">草稿</option>
                          <option value="disabled">停用</option>
                        </select>
                      </div>
                      <input
                        name="summaryPattern"
                        type="hidden"
                        value={template.summaryPattern ?? ""}
                      />
                      <div className="grid gap-2 md:grid-cols-3">
                        <select
                          className={inputClassName}
                          defaultValue={String(template.autoPublish)}
                          name="autoPublish"
                        >
                          <option value="false">不自动发布</option>
                          <option value="true">自动发布</option>
                        </select>
                        <select
                          className={inputClassName}
                          defaultValue={String(template.requireReview)}
                          name="requireReview"
                        >
                          <option value="true">需要审核</option>
                          <option value="false">直接发布</option>
                        </select>
                        <RunButton label="保存" />
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {reports.length === 0 ? (
          <AdminEmptyState
            description="点击上方按钮后会生成第一份日报记录。"
            title="还没有日报"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">日报</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">展示策略</th>
                <th className="px-5 py-3">发布时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((report) => (
                <tr className="hover:bg-slate-50/80" key={report.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{report.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {report.reportDate}
                    </div>
                    {report.summary ? (
                      <p className="mt-2 max-w-[520px] text-sm leading-6 text-slate-500">
                        {report.summary}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={report.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {report.channelLimit} 个频道 / 每频道{" "}
                    {report.itemLimitPerChannel} 条
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDateTime(report.publishedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <ViewLink
                        href={`/admin/operations/daily/${report.id}`}
                        label="编辑精选"
                      />
                      {report.status === "active" ? (
                        <form action={updateDailyReportStatusAction}>
                          <input name="id" type="hidden" value={report.id} />
                          <input name="status" type="hidden" value="disabled" />
                          <input
                            name="backTo"
                            type="hidden"
                            value="/admin/operations/daily"
                          />
                          <RunButton label="下线" />
                        </form>
                      ) : (
                        <form action={updateDailyReportStatusAction}>
                          <input name="id" type="hidden" value={report.id} />
                          <input name="status" type="hidden" value="active" />
                          <input
                            name="backTo"
                            type="hidden"
                            value="/admin/operations/daily"
                          />
                          <RunButton label="发布" />
                        </form>
                      )}
                    </div>
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

const inputClassName =
  "min-h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
