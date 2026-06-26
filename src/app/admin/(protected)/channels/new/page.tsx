import {
  AdminAlert,
  AdminBackLink,
  AdminPageHeader,
} from "@/features/admin-content/components/admin-ui"
import { ChannelForm } from "@/features/admin-content/components/forms"
import { createChannelAction } from "@/features/admin-content/actions"
import { listChannelFormOptions } from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function NewChannelPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [options, errorMessage] = await Promise.all([
    listChannelFormOptions(),
    getErrorMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminBackLink href="/admin/channels" />
      <AdminPageHeader
        description="后台只保存运营配置，不在线填写采集代码。definition_key 负责绑定代码仓库中的频道定义文件。"
        eyebrow="频道管理"
        title="新建频道"
      />
      <AdminAlert message={errorMessage} />
      <ChannelForm
        action={createChannelAction}
        options={options}
        submitLabel="保存频道"
      />
    </div>
  )
}
