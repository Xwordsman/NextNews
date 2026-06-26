import { notFound } from "next/navigation"
import {
  AdminAlert,
  AdminBackLink,
  AdminPageHeader,
} from "@/features/admin-content/components/admin-ui"
import { CategoryForm } from "@/features/admin-content/components/forms"
import { updateCategoryAction } from "@/features/admin-content/actions"
import {
  getAdminCategory,
  listAdminCategories,
} from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: AdminSearchParams
}) {
  const { id } = await params
  const [category, categories, errorMessage] = await Promise.all([
    getAdminCategory(id),
    listAdminCategories(),
    getErrorMessage(searchParams),
  ])

  if (!category) {
    notFound()
  }

  return (
    <div className="grid gap-6">
      <AdminBackLink href="/admin/categories" />
      <AdminPageHeader
        description="修改分类显示状态会影响前台导航和首页分组。"
        eyebrow="分类管理"
        title={`编辑分类：${category.categoryName}`}
      />
      <AdminAlert message={errorMessage} />
      <CategoryForm
        action={updateCategoryAction}
        categories={categories}
        category={category}
        submitLabel="保存修改"
      />
    </div>
  )
}
