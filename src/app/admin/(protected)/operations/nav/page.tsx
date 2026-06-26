import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  EditLink,
  StatusBadge,
} from "@/features/admin-content/components/admin-ui"
import { listAdminNavCategoriesOperation } from "@/features/admin-content/queries"

export const dynamic = "force-dynamic"

export default async function AdminNavOperationPage() {
  const categories = await listAdminNavCategoriesOperation()

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="前台导航当前读取分类的导航可见、首页可见、状态和排序字段。这里集中检查导航分类是否具备可展示频道。"
        eyebrow="Operations"
        title="导航配置"
      />

      <AdminSection>
        {categories.length === 0 ? (
          <AdminEmptyState
            description="创建分类后，这里会展示分类在前台导航和首页中的可见状态。"
            title="还没有分类"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">分类</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">公开频道</th>
                <th className="px-5 py-3">排序</th>
                <th className="px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.map((category) => (
                <tr className="hover:bg-slate-50/80" key={category.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 rounded-full border border-slate-200"
                        style={{ backgroundColor: category.color ?? "#e2e8f0" }}
                      />
                      <div>
                        <div className="font-semibold">
                          {category.categoryName}
                        </div>
                        <div className="mt-1 font-mono text-xs text-slate-500">
                          {category.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={category.status} />
                      <BooleanBadge
                        active={category.isNavVisible}
                        activeLabel="导航"
                        inactiveLabel="不进导航"
                      />
                      <BooleanBadge
                        active={category.isHomeVisible}
                        activeLabel="首页"
                        inactiveLabel="不进首页"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {category.activePublicChannelCount}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {category.sort}
                  </td>
                  <td className="px-5 py-4">
                    <EditLink href={`/admin/categories/${category.id}/edit`} />
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
