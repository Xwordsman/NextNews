import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"

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
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-[28px] font-semibold leading-none tracking-normal">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      {action ? (
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black"
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
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-900 hover:text-white"
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
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
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
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
      role="status"
    >
      {message}
    </p>
  )
}

export function AdminSection({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/85 shadow-sm backdrop-blur-xl">
      {children}
    </section>
  )
}

export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
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
    <div className="grid gap-2 px-5 py-12 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="text-sm text-slate-500">{description}</p>
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
          : "border-slate-200 bg-slate-100 text-slate-600"

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${className}`}
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
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-600"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export function DeleteButton({ label }: { label: string }) {
  return (
    <button
      className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-red-200 bg-white px-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
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
      className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
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
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
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
      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
      href={href}
    >
      <Eye aria-hidden="true" size={15} />
      {label}
    </Link>
  )
}

export function formatDateTime(value: Date | string | null) {
  if (!value) {
    return "未产生"
  }

  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
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
