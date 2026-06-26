import Link from "next/link"

export default function NotFound() {
  return (
    <main className="page-shell grid place-items-center px-4">
      <section className="surface w-full max-w-md p-8">
        <p className="text-sm font-semibold text-[var(--color-accent)]">404</p>
        <h1 className="mt-3 text-2xl font-semibold">页面不存在</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          当前地址没有对应的 NextNews 页面。
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--color-foreground)] px-4 text-sm font-medium text-white transition-colors hover:bg-black"
          href="/"
        >
          回到首页
        </Link>
      </section>
    </main>
  )
}
