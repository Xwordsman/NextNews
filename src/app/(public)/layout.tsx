import type { ReactNode } from "react"
import { requireInstalled } from "@/server/install/guard"

export const dynamic = "force-dynamic"

export default async function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireInstalled()

  return children
}
