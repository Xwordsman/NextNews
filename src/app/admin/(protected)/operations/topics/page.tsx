import { AdminModulePlaceholder } from "@/features/admin-content/components/module-placeholder"

export const dynamic = "force-dynamic"

export default function AdminTopicsOperationPage() {
  return (
    <AdminModulePlaceholder
      description="管理前台话题聚合、关键词和关联频道。"
      eyebrow="Operations"
      title="话题配置"
    />
  )
}
