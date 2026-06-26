import { notFound } from "next/navigation"
import {
  PublicContentShell,
  PublicPageHero,
  PublicRankList,
  PublicTopBar,
  formatDateTime,
} from "@/features/public-content/components/public-content-ui"
import { getPublicChannelSnapshot } from "@/features/public-content/queries"
import { getCurrentUser } from "@/server/auth/session"
import { getHistoryAccessForUser } from "@/server/membership/access"

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
  const user = await getCurrentUser()
  const access = await getHistoryAccessForUser(user?.id)
  const data = await getPublicChannelSnapshot(
    siteSlug,
    channelSlug,
    snapshotId,
    {
      earliestSnapshotDate: access.earliestDate,
    },
  )

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
      <PublicRankList
        backTo={`/channels/${siteSlug}/${channelSlug}/snapshots/${snapshotId}`}
        items={data.items}
      />
    </PublicContentShell>
  )
}
