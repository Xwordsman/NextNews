import { notFound } from "next/navigation"
import {
  AdminAlert,
  AdminBackLink,
  AdminPageHeader,
} from "@/features/admin-content/components/admin-ui"
import { SiteForm } from "@/features/admin-content/components/forms"
import { updateSiteAction } from "@/features/admin-content/actions"
import { getAdminSite } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function EditSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: AdminSearchParams
}) {
  const { id } = await params
  const [site, errorMessage] = await Promise.all([
    getAdminSite(id),
    getErrorMessage(searchParams),
  ])

  if (!site) {
    notFound()
  }

  return (
    <div className="grid gap-6">
      <AdminBackLink href="/admin/sites" />
      <AdminPageHeader
        description="站点 slug 会影响前台站点 URL，修改前要确认是否已有外链或收藏入口。"
        eyebrow="站点管理"
        title={`编辑站点：${site.siteName}`}
      />
      <AdminAlert message={errorMessage} />
      <SiteForm action={updateSiteAction} site={site} submitLabel="保存修改" />
    </div>
  )
}
