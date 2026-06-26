import { AdminModulePlaceholder } from "@/features/admin-content/components/module-placeholder"

export const dynamic = "force-dynamic"

export default function AdminDailyOperationPage() {
  return (
    <AdminModulePlaceholder
      description="配置日报生成策略、展示频道和发布时间。"
      eyebrow="Operations"
      title="日报配置"
    />
  )
}
