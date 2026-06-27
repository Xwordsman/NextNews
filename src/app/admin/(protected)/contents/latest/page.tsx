import Link from "next/link"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  DeleteButton,
  ViewLink,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { blockSnapshotItemAction } from "@/features/admin-content/actions"
import { listAdminLatestContents } from "@/features/admin-content/queries"
import type { AdminSearchParams } from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

const LATEST_CONTENT_PAGE_SIZE = 30

export default async function AdminLatestContentsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const params = await searchParams
  const query = getSearchParamValue(params.q).trim()
  const page = getPageParam(getSearchParamValue(params.page))
  const errorMessage = getSearchParamValue(params.error) || undefined
  const noticeMessage = getSearchParamValue(params.notice) || undefined
  const { items, pagination } = await listAdminLatestContents({
    page,
    pageSize: LATEST_CONTENT_PAGE_SIZE,
    query,
  })
  const currentHref = buildLatestContentsHref({
    page: pagination.page,
    query: pagination.query,
  })
  const pageItems = getPaginationItems(pagination.page, pagination.totalPages)

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="汇总最近入库的快照条目，便于快速检查标题、热度、来源频道和入库时间。"
        eyebrow="Contents"
        title="最新内容"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <form
            action="/admin/contents/latest"
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            method="get"
          >
            <label className="sr-only" htmlFor="latest-content-search">
              搜索最新内容
            </label>
            <div className="flex min-h-9 min-w-[240px] flex-1 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-zinc-500 shadow-sm focus-within:border-zinc-400">
              <Search aria-hidden="true" size={16} />
              <input
                className="min-h-9 min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                defaultValue={query}
                id="latest-content-search"
                name="q"
                placeholder="搜索标题、链接、站点或频道"
                type="search"
              />
            </div>
            <button
              className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-zinc-950 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus-visible:outline-none"
              type="submit"
            >
              <Search aria-hidden="true" size={15} />
              搜索
            </button>
            {query ? (
              <Link
                className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none"
                href="/admin/contents/latest"
              >
                清除
              </Link>
            ) : null}
          </form>
          <p className="text-sm text-zinc-500">
            共{" "}
            <span className="font-semibold text-zinc-900">
              {pagination.total}
            </span>{" "}
            条内容
          </p>
        </div>

        {items.length === 0 ? (
          <AdminEmptyState
            description={
              query
                ? "没有找到匹配的内容，可以换一个标题、频道、站点或链接关键词。"
                : "Worker 成功采集并写入快照后，这里会展示最近入库的内容条目。"
            }
            title={query ? "没有匹配内容" : "还没有入库内容"}
          />
        ) : (
          <>
            <AdminTable>
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
                <tr>
                  <th className="px-5 py-3">内容</th>
                  <th className="px-5 py-3">来源</th>
                  <th className="px-5 py-3">排名</th>
                  <th className="px-5 py-3">热度</th>
                  <th className="px-5 py-3">审核</th>
                  <th className="px-5 py-3">入库时间</th>
                  <th className="px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {items.map((item) => (
                  <tr className="hover:bg-zinc-50/80" key={item.id}>
                    <td className="max-w-[420px] px-5 py-4">
                      <a
                        className="line-clamp-2 font-semibold text-zinc-900 transition-colors hover:text-zinc-600 hover:underline"
                        href={item.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {item.title}
                      </a>
                      {item.tag ? (
                        <div className="mt-1 text-xs text-zinc-500">
                          {item.tag}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold">{item.channelName}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {item.siteName} / {item.siteSlug}.{item.channelSlug}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-500">
                      {item.rankNo ?? "-"}
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-500">
                      {item.hotLabel ?? item.hotValue ?? "-"}
                    </td>
                    <td className="px-5 py-4">
                      <BooleanBadge
                        active={!item.blockedId}
                        activeLabel="展示"
                        inactiveLabel="已屏蔽"
                      />
                    </td>
                    <td className="px-5 py-4 text-sm text-zinc-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <ViewLink
                          href={`/admin/contents/snapshots/${item.snapshotId}`}
                          label="快照"
                        />
                        {item.blockedId ? null : (
                          <form action={blockSnapshotItemAction}>
                            <input name="id" type="hidden" value={item.id} />
                            <input
                              name="backTo"
                              type="hidden"
                              value={currentHref}
                            />
                            <DeleteButton label="屏蔽" />
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-5 py-4 text-sm text-zinc-500">
              <p>
                第{" "}
                <span className="font-semibold text-zinc-900">
                  {pagination.page}
                </span>{" "}
                / {pagination.totalPages} 页，每页 {pagination.pageSize} 条
              </p>
              <nav
                aria-label="最新内容分页"
                className="flex flex-wrap items-center gap-2"
              >
                {pagination.page > 1 ? (
                  <Link
                    className="inline-flex min-h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-none"
                    href={buildLatestContentsHref({
                      page: pagination.page - 1,
                      query: pagination.query,
                    })}
                  >
                    <ChevronLeft aria-hidden="true" size={15} />
                    上一页
                  </Link>
                ) : (
                  <span className="inline-flex min-h-8 items-center gap-1 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 font-medium text-zinc-400">
                    <ChevronLeft aria-hidden="true" size={15} />
                    上一页
                  </span>
                )}

                {pageItems.map((item) =>
                  typeof item === "number" ? (
                    item === pagination.page ? (
                      <span
                        aria-current="page"
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md bg-zinc-950 px-2 font-semibold text-white"
                        key={item}
                      >
                        {item}
                      </span>
                    ) : (
                      <Link
                        className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-md border border-zinc-200 bg-white px-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-none"
                        href={buildLatestContentsHref({
                          page: item,
                          query: pagination.query,
                        })}
                        key={item}
                      >
                        {item}
                      </Link>
                    )
                  ) : (
                    <span
                      className="inline-flex min-h-8 min-w-8 items-center justify-center px-1 text-zinc-400"
                      key={item}
                    >
                      ...
                    </span>
                  ),
                )}

                {pagination.page < pagination.totalPages ? (
                  <Link
                    className="inline-flex min-h-8 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white focus-visible:outline-none"
                    href={buildLatestContentsHref({
                      page: pagination.page + 1,
                      query: pagination.query,
                    })}
                  >
                    下一页
                    <ChevronRight aria-hidden="true" size={15} />
                  </Link>
                ) : (
                  <span className="inline-flex min-h-8 items-center gap-1 rounded-md border border-zinc-100 bg-zinc-50 px-2.5 font-medium text-zinc-400">
                    下一页
                    <ChevronRight aria-hidden="true" size={15} />
                  </span>
                )}
              </nav>
            </div>
          </>
        )}
      </AdminSection>
    </div>
  )
}

function getSearchParamValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? ""
  }

  return value ?? ""
}

function getPageParam(value: string) {
  const page = Number.parseInt(value, 10)

  if (!Number.isFinite(page) || page < 1) {
    return 1
  }

  return page
}

function buildLatestContentsHref({
  page,
  query,
}: {
  page: number
  query: string
}) {
  const params = new URLSearchParams()

  if (query) {
    params.set("q", query)
  }

  if (page > 1) {
    params.set("page", String(page))
  }

  const search = params.toString()

  return search ? `/admin/contents/latest?${search}` : "/admin/contents/latest"
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const items: Array<number | string> = [1]
  const windowStart = Math.max(2, currentPage - 1)
  const windowEnd = Math.min(totalPages - 1, currentPage + 1)

  if (windowStart > 2) {
    items.push("ellipsis-start")
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    items.push(page)
  }

  if (windowEnd < totalPages - 1) {
    items.push("ellipsis-end")
  }

  items.push(totalPages)

  return items
}
