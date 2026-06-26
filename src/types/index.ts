export type NewsItem = {
  sourceItemId?: string
  title: string
  url: string
  mobileUrl?: string
  imageUrl?: string
  summary?: string
  rankNo?: number
  hotValue?: string | number
  hotLabel?: string
  tag?: string
  publishedAt?: string
  extra?: Record<string, unknown>
}
