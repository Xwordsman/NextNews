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
import { deleteCategoryAction } from "@/features/admin-content/actions"
import { listAdminCategories } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [categories, errorMessage] = await Promise.all([
    listAdminCategories(),
    getErrorMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        action={{ href: "/admin/categories/new", label: "新建分类" }}
        description="分类负责前台导航、首页分组和频道归类。第一版先做轻量父子级，后续再扩展专题和榜中榜。"
        eyebrow="内容源"
        title="分类管理"
      />
      <AdminAlert message={errorMessage} />
      <AdminSection>
        {categories.length === 0 ? (
          <AdminEmptyState
            description="建议先创建综合、科技、娱乐等基础分类。"
            title="还没有分类"
          />
        ) : (
          <AdminTable>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500">
                <th className="px-5 py-3 font-semibold">分类</th>
                <th className="px-5 py-3 font-semibold">slug</th>
                <th className="px-5 py-3 font-semibold">父级</th>
                <th className="px-5 py-3 font-semibold">状态</th>
                <th className="px-5 py-3 font-semibold">显示</th>
                <th className="px-5 py-3 font-semibold">操作</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr
                  className="border-b border-zinc-200 last:border-0 hover:bg-zinc-50/80"
                  key={category.id}
                >
                  <td className="px-5 py-4">
                    <div className="font-semibold">{category.categoryName}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {category.icon ?? "未设置图标"} ·{" "}
                      {category.color ?? "未设置颜色"}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {category.slug}
                  </td>
                  <td className="px-5 py-4">{category.parentName ?? "无"}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={category.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
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
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <EditLink
                        href={`/admin/categories/${category.id}/edit`}
                      />
                      <form action={deleteCategoryAction}>
                        <input name="id" type="hidden" value={category.id} />
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
