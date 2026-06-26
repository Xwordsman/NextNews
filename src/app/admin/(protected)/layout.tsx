import type { ReactNode } from "react"
import { AdminShell } from "@/features/admin-shell/components/admin-shell"
import { requireAdmin } from "@/server/auth/session"

export const dynamic = "force-dynamic"

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const admin = await requireAdmin()

  return <AdminShell admin={admin}>{children}</AdminShell>
}
