import { notFound } from "next/navigation"
import {
  PublicContentShell,
  PublicPageHero,
  PublicRankList,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicChannelSnapshot } from "@/features/public-content/queries"

export const dynamic = "force-dynamic"

export default async function ChannelSnapshotPage({
  params,
}: {
  params: Promise<{
    siteSlug: string
    channelSlug: string
    snapshotId: string
  }>
}) {
  const { channelSlug, siteSlug, snapshotId } = await params
  const data = await getPublicChannelSnapshot(siteSlug, channelSlug, snapshotId)

  if (!data) {
    notFound()
  }

  return (
    <PublicContentShell>
      <PublicTopBar />
      <PublicPageHero
        description={`${data.channel.siteName} / ${data.channel.definitionKey}`}
        eyebrow="Snapshot"
        meta={`${data.snapshot.itemCount} 条 / ${data.snapshot.status}`}
        title={`${data.channel.channelName} ${formatDateTime(data.snapshot.snapshotTime)}`}
      />
      <PublicRankList items={data.items} />
    </PublicContentShell>
  )
}
