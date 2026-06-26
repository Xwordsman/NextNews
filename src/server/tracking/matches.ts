import { and, desc, eq, isNull } from "drizzle-orm"
import { findMatchedKeyword, parseKeywords } from "@/server/content/keywords"
import { getDb } from "@/server/db/client"
import {
  bizChannel,
  bizChannelSnapshot,
  bizContentBlock,
  bizSite,
  bizSnapshotItem,
  userNotification,
  userTrackingMatch,
  userTrackingRule,
} from "@/server/db/schema"

type TrackingCandidate = {
  id: string
  title: string
  url: string
  summary: string | null
  tag: string | null
  siteSlug: string
  channelSlug: string
}

export async function recordTrackingMatchesForSnapshot(snapshotId: string) {
  const db = getDb()
  const [rules, items] = await Promise.all([
    db
      .select({
        id: userTrackingRule.id,
        userId: userTrackingRule.userId,
        keyword: userTrackingRule.keyword,
        notifyEnabled: userTrackingRule.notifyEnabled,
      })
      .from(userTrackingRule)
      .where(eq(userTrackingRule.isEnabled, true)),
    listSnapshotCandidates(snapshotId),
  ])

  if (rules.length === 0 || items.length === 0) {
    return { insertedCount: 0 }
  }

  let insertedCount = 0

  for (const rule of rules) {
    insertedCount += await recordRuleMatches(rule, items)
  }

  return { insertedCount }
}

export async function recordTrackingMatchesForRule(ruleId: string) {
  const db = getDb()
  const [rule] = await db
    .select({
      id: userTrackingRule.id,
      userId: userTrackingRule.userId,
      keyword: userTrackingRule.keyword,
      notifyEnabled: userTrackingRule.notifyEnabled,
      isEnabled: userTrackingRule.isEnabled,
    })
    .from(userTrackingRule)
    .where(eq(userTrackingRule.id, ruleId))
    .limit(1)

  if (!rule || !rule.isEnabled) {
    return { insertedCount: 0 }
  }

  const items = await listLatestCandidates(240)

  return { insertedCount: await recordRuleMatches(rule, items) }
}

async function listSnapshotCandidates(snapshotId: string) {
  return getDb()
    .select({
      id: bizSnapshotItem.id,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      summary: bizSnapshotItem.summary,
      tag: bizSnapshotItem.tag,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(
      and(
        eq(bizSnapshotItem.snapshotId, snapshotId),
        isNull(bizContentBlock.id),
      ),
    )
}

async function listLatestCandidates(limit: number) {
  return getDb()
    .select({
      id: bizSnapshotItem.id,
      title: bizSnapshotItem.title,
      url: bizSnapshotItem.url,
      summary: bizSnapshotItem.summary,
      tag: bizSnapshotItem.tag,
      siteSlug: bizSite.slug,
      channelSlug: bizChannel.slug,
    })
    .from(bizSnapshotItem)
    .innerJoin(bizChannel, eq(bizSnapshotItem.channelId, bizChannel.id))
    .innerJoin(bizSite, eq(bizChannel.siteId, bizSite.id))
    .innerJoin(
      bizChannelSnapshot,
      eq(bizSnapshotItem.snapshotId, bizChannelSnapshot.id),
    )
    .leftJoin(
      bizContentBlock,
      and(
        eq(bizSnapshotItem.urlHash, bizContentBlock.urlHash),
        isNull(bizContentBlock.deletedAt),
      ),
    )
    .where(
      and(
        isNull(bizContentBlock.id),
        isNull(bizChannel.deletedAt),
        isNull(bizSite.deletedAt),
        eq(bizChannel.status, "active"),
        eq(bizChannel.isPublic, true),
        eq(bizSite.status, "active"),
        eq(bizSite.isVisible, true),
      ),
    )
    .orderBy(
      desc(bizChannelSnapshot.snapshotTime),
      desc(bizSnapshotItem.createdAt),
    )
    .limit(limit)
}

async function recordRuleMatches(
  rule: {
    id: string
    userId: string
    keyword: string
    notifyEnabled: boolean
  },
  items: TrackingCandidate[],
) {
  const db = getDb()
  const keywords = parseKeywords(rule.keyword)
  let insertedCount = 0

  for (const item of items) {
    const matchedKeyword = findMatchedKeyword(item, keywords)

    if (!matchedKeyword) {
      continue
    }

    const [match] = await db
      .insert(userTrackingMatch)
      .values({
        ruleId: rule.id,
        userId: rule.userId,
        snapshotItemId: item.id,
        title: item.title,
        url: item.url,
        matchedKeyword,
      })
      .onConflictDoNothing({
        target: [userTrackingMatch.ruleId, userTrackingMatch.snapshotItemId],
      })
      .returning({
        id: userTrackingMatch.id,
        matchedAt: userTrackingMatch.matchedAt,
      })

    if (!match) {
      continue
    }

    insertedCount += 1

    if (rule.notifyEnabled) {
      await db.insert(userNotification).values({
        userId: rule.userId,
        notificationType: "tracking_match",
        title: `追踪命中：${matchedKeyword}`,
        body: item.title,
        href: `/channels/${item.siteSlug}/${item.channelSlug}`,
        sourceType: "tracking_match",
        sourceId: match.id,
      })
    }

    await db
      .update(userTrackingRule)
      .set({
        lastMatchedAt: match.matchedAt,
        updatedAt: new Date(),
      })
      .where(eq(userTrackingRule.id, rule.id))
  }

  return insertedCount
}
