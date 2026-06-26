"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  Database,
  FolderTree,
  Gauge,
  LibraryBig,
  Megaphone,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react"
import { adminNavigation } from "../navigation"

const groupIcons: Record<string, LucideIcon> = {
  工作台: Gauge,
  内容源: Database,
  抓取中心: Activity,
  内容库: LibraryBig,
  前台运营: Megaphone,
  用户中心: Users,
  系统设置: Settings2,
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebarNav() {
  const pathname = usePathname()

  return (
    <nav aria-label="后台菜单" className="grid gap-5 p-3">
      {adminNavigation.map((group) => {
        const Icon = groupIcons[group.title] ?? FolderTree

        return (
          <section className="grid gap-2" key={group.title}>
            <div className="flex items-center gap-2 px-2 text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              <Icon aria-hidden="true" size={15} strokeWidth={2} />
              <span>{group.title}</span>
            </div>
            <div className="grid gap-1">
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href)

                return (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "flex min-h-9 items-center rounded-md bg-zinc-950 px-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-900 focus-visible:bg-zinc-900 focus-visible:outline-none"
                        : "flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 focus-visible:outline-none"
                    }
                    href={item.href}
                    key={item.href}
                  >
                    {item.title}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </nav>
  )
}
