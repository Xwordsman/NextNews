export type AdminSearchParams = Promise<{
  error?: string | string[]
  notice?: string | string[]
  page?: string | string[]
  q?: string | string[]
}>

export async function getErrorMessage(searchParams: AdminSearchParams) {
  const params = await searchParams
  const error = Array.isArray(params.error) ? params.error[0] : params.error

  return error || undefined
}

export async function getNoticeMessage(searchParams: AdminSearchParams) {
  const params = await searchParams
  const notice = Array.isArray(params.notice) ? params.notice[0] : params.notice

  return notice || undefined
}
