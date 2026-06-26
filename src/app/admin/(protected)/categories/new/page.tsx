import {
  AdminAlert,
  AdminBackLink,
  AdminPageHeader,
} from "@/features/admin-content/components/admin-ui"
import { CategoryForm } from "@/features/admin-content/components/forms"
import { createCategoryAction } from "@/features/admin-content/actions"
import { listAdminCategories } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function NewCategoryPage({
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
      <AdminBackLink href="/admin/categories" />
      <AdminPageHeader
        description="分类先服务于频道归类、首页模块和导航展示，不承载采集逻辑。"
        eyebrow="分类管理"
        title="新建分类"
      />
      <AdminAlert message={errorMessage} />
      <CategoryForm
        action={createCategoryAction}
        categories={categories}
        submitLabel="保存分类"
      />
    </div>
  )
}
