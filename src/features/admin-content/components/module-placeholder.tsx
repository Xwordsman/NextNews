import { AdminPageHeader, AdminSection } from "./admin-ui"

export function AdminModulePlaceholder({
  description,
  eyebrow,
  title,
}: {
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      <AdminSection>
        <div className="grid gap-2 px-5 py-12 text-center">
          <h2 className="text-base font-semibold">模块已预留</h2>
          <p className="text-sm text-slate-500">
            当前核心数据结构已经就绪，后续会继续接入可编辑配置。
          </p>
        </div>
      </AdminSection>
    </div>
  )
}
