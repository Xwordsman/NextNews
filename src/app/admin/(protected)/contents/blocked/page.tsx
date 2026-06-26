import { AdminModulePlaceholder } from "@/features/admin-content/components/module-placeholder"

export const dynamic = "force-dynamic"

export default function AdminBlockedContentsPage() {
  return (
    <AdminModulePlaceholder
      description="管理需要从前台隐藏的标题、链接或来源规则。"
      eyebrow="Moderation"
      title="屏蔽内容"
    />
  )
}
