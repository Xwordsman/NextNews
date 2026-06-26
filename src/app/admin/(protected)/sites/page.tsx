import Link from "next/link"
import {
  AdminAlert,
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  DeleteButton,
  EditLink,
  StatusBadge,
} from "@/features/admin-content/components/admin-ui"
import { deleteSiteAction } from "@/features/admin-content/actions"
import { listAdminSites } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function SitesPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [sites, errorMessage] = await Promise.all([
    listAdminSites(),
    getErrorMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        action={{ href: "/admin/sites/new", label: "新建站点" }}
        description="站点是内容来源的主体，一个站点可以挂多个频道或榜单，例如微博可以有热搜、文娱榜、同城榜。"
        eyebrow="内容源"
        title="站点管理"
      />
      <AdminAlert message={errorMessage} />
      <AdminSection>
        {sites.length === 0 ? (
          <AdminEmptyState
            description="先创建第一个站点，再为它绑定频道。"
            title="还没有站点"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500">
                <th className="px-5 py-3 font-semibold">站点</th>
                <th className="px-5 py-3 font-semibold">slug</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">前台</th>
                <th className="px-5 py-3 font-semibold">排序</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr
                  className="border-b border-slate-200 last:border-0 hover:bg-slate-50/80"
                  key={site.id}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold">{site.siteName}</div>
                    {site.homepageUrl ? (
                      <Link
                        className="mt-1 block text-xs text-blue-600"
                        href={site.homepageUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {site.homepageUrl}
                      </Link>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{site.slug}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={site.status} />
                  </td>
                  <td className="px-5 py-4">
                    <BooleanBadge
                      active={site.isVisible}
                      activeLabel="可见"
                      inactiveLabel="隐藏"
                    />
                  </td>
                  <td className="px-5 py-4">{site.sort}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <EditLink href={`/admin/sites/${site.id}/edit`} />
                      <form action={deleteSiteAction}>
                        <input name="id" type="hidden" value={site.id} />
                        <DeleteButton label="删除" />
                      </form>
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
