import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { formatAppDateTime } from "@/lib/date-format"

type AdminPageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  action?: {
    href: string
    label: string
  }
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-[28px]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
          {description}
        </p>
      </div>
      {action ? (
        <Link
          className="inline-flex min-h-9 items-center gap-2 rounded-md bg-zinc-950 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none"
          href={action.href}
        >
          <Plus aria-hidden="true" size={16} />
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export function AdminBackLink({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none"
      href={href}
    >
      <ArrowLeft aria-hidden="true" size={16} />
      返回列表
    </Link>
  )
}

export function AdminAlert({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
      role="alert"
    >
      {message}
    </p>
  )
}

export function AdminNotice({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p
      className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
      role="status"
    >
      {message}
    </p>
  )
}

export function AdminSection({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </section>
  )
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm text-zinc-700 [&_tbody_tr]:border-b [&_tbody_tr]:border-zinc-100 [&_tbody_tr:last-child]:border-0 [&_tbody_tr:hover]:bg-zinc-50/80 [&_td]:px-4 [&_td]:py-3.5 [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium [&_thead]:bg-zinc-50 [&_thead]:text-xs [&_thead]:uppercase [&_thead]:tracking-[0.04em] [&_thead]:text-zinc-500">
        {children}
      </table>
    </div>
  )
}

export function AdminEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="grid gap-2 px-5 py-14 text-center">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <p className="text-sm text-zinc-500">{description}</p>
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    active: "启用",
    draft: "草稿",
    disabled: "停用",
    duplicate: "重复",
    failed: "失败",
    ignored: "忽略",
    paid: "已支付",
    pending: "待处理",
    refunded: "已退款",
    running: "运行中",
    skipped: "跳过",
    success: "成功",
    canceled: "已取消",
  }
  const className =
    status === "active" || status === "success" || status === "paid"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "draft" || status === "running" || status === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "failed"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-zinc-200 bg-zinc-100 text-zinc-600"

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 text-xs font-medium ${className}`}
    >
      {labels[status] ?? status}
    </span>
  )
}

export function BooleanBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-md border px-2 text-xs font-medium ${
        active
          ? "border-zinc-300 bg-zinc-950 text-white"
          : "border-zinc-200 bg-zinc-100 text-zinc-600"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border border-red-200 bg-white px-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none"
      type="submit"
    >
      <Trash2 aria-hidden="true" size={15} />
      {label}
    </button>
  )
}

export function RunButton({ label }: { label: string }) {
  return (
    <button
      className="inline-flex min-h-8 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-none"
      type="submit"
    >
      <RefreshCw aria-hidden="true" size={15} />
      {label}
    </button>
  )
}

export function EditLink({ href }: { href: string }) {
  return (
    <Link
      className="inline-flex min-h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-none"
      href={href}
    >
      <Pencil aria-hidden="true" size={15} />
      编辑
    </Link>
  )
}

export function ViewLink({
  href,
  label = "查看",
}: {
  href: string
  label?: string
}) {
  return (
    <Link
      className="inline-flex min-h-8 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-none"
      href={href}
    >
      <Eye aria-hidden="true" size={15} />
      {label}
    </Link>
  )
}

export function formatDateTime(value: Date | string | null) {
  return formatAppDateTime(value)
}

export function formatDurationMs(value: number | null) {
  if (value === null) {
    return "-"
  }

  if (value < 1000) {
    return `${value} ms`
  }

  return `${(value / 1000).toFixed(1)} s`
}
