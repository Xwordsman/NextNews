import { notFound } from "next/navigation"
import {
  AdminAlert,
  AdminBackLink,
  AdminPageHeader,
} from "@/features/admin-content/components/admin-ui"
import { ChannelForm } from "@/features/admin-content/components/forms"
import { updateChannelAction } from "@/features/admin-content/actions"
import {
  getAdminChannel,
  listChannelFormOptions,
} from "@/features/admin-content/queries"
import {
  getErrorMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function EditChannelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: AdminSearchParams
}) {
  const { id } = await params
  const [channel, options, errorMessage] = await Promise.all([
    getAdminChannel(id),
    listChannelFormOptions(),
    getErrorMessage(searchParams),
  ])

  if (!channel) {
    notFound()
  }

  return (
    <div className="grid gap-6">
      <AdminBackLink href="/admin/channels" />
      <AdminPageHeader
        description="采集逻辑仍然由频道定义文件控制；这里修改的是前台展示、订阅和调度频率。"
        eyebrow="频道管理"
        title={`编辑频道：${channel.channelName}`}
      />
      <AdminAlert message={errorMessage} />
      <ChannelForm
        action={updateChannelAction}
        channel={channel}
        options={options}
        submitLabel="保存修改"
      />
    </div>
  )
}
