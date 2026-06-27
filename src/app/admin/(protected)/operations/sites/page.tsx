import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  EditLink,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { listAdminHotSitesOperation } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminHotSitesOperationPage() {
  const sites = await listAdminHotSitesOperation()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="热门站点入口来自站点管理的可见性与排序字段。一个站点下可以挂多个频道，首页频道数量会影响前台露出强度。"
        eyebrow="Operations"
        title="热门站点"
      />

      <AdminSection>
        {sites.length === 0 ? (
          <AdminEmptyState
            description="创建站点后，这里会展示站点在前台运营中的可见状态。"
            title="还没有站点"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
              <tr>
                <th className="px-5 py-3">站点</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">频道</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3">更新时间</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {sites.map((site) => (
                <tr className="hover:bg-zinc-50/80" key={site.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{site.siteName}</div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">
                      {site.slug}
                    </div>
                    {site.homepageUrl ? (
                      <a
                        className="mt-1 block truncate text-xs text-zinc-500 transition-colors hover:text-zinc-900 hover:underline"
                        href={site.homepageUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {site.homepageUrl}
                      </a>
                    ) : null}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={site.status} />
                      <BooleanBadge
                        active={site.isVisible}
                        activeLabel="前台可见"
                        inactiveLabel="前台隐藏"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    <div>{site.activePublicChannelCount} 个公开频道</div>
                    <div className="mt-1 text-xs">
                      {site.homeChannelCount} 个首页频道
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {site.sort}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-500">
                    {formatDateTime(site.updatedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <EditLink href={`/admin/sites/${site.id}/edit`} />
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
