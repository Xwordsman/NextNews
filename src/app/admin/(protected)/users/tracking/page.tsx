import { AdminModulePlaceholder } from "@/features/admin-content/components/module-placeholder"

export const dynamic = "force-dynamic"

export default function AdminUserTrackingPage() {
  return (
    <AdminModulePlaceholder
      description="管理用户追踪关键词、规则和后续通知策略。"
      eyebrow="Tracking"
      title="追踪规则"
    />
  )
}
