import {
  AdminAlert,
  AdminBackLink,
  AdminPageHeader,
} from "@/features/admin-content/components/admin-ui"
import { SiteForm } from "@/features/admin-content/components/forms"
import { createSiteAction } from "@/features/admin-content/actions"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function NewSitePage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const errorMessage = await getErrorMessage(searchParams)

  return (
    <div className="grid gap-6">
      <AdminBackLink href="/admin/sites" />
      <AdminPageHeader
        description="创建站点只负责来源主体信息；具体榜单和采集频率在频道里配置。"
        eyebrow="站点管理"
        title="新建站点"
      />
      <AdminAlert message={errorMessage} />
      <SiteForm action={createSiteAction} submitLabel="保存站点" />
    </div>
  )
}
