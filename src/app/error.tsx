"use client"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="page-shell grid place-items-center px-4">
      <section className="surface w-full max-w-md p-8">
        <p className="text-sm font-semibold text-[var(--color-accent)]">
          Error
        </p>
        <h1 className="mt-3 text-2xl font-semibold">页面暂时无法显示</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          请稍后重试，或返回首页继续浏览。
        </p>
        <button
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-[var(--color-foreground)] px-4 text-sm font-medium text-white transition-colors hover:bg-black"
          type="button"
          onClick={reset}
        >
          重试
        </button>
      </section>
    </main>
  )
}
