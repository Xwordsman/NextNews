import { BellPlus, BellOff } from "lucide-react"
import {
  subscribeChannelAction,
  unsubscribeChannelAction,
  updateSubscriptionNotifyAction,
} from "@/features/account/actions"

export function ChannelSubscriptionControl({
  backTo,
  channelId,
  isSubscribable,
  isSubscribed,
}: {
  backTo: string
  channelId: string
  isSubscribable: boolean
  isSubscribed: boolean
}) {
  if (!isSubscribable) {
    return (
      <span className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-500">
        暂不开放订阅
      </span>
    )
  }

  return (
    <form
      action={isSubscribed ? unsubscribeChannelAction : subscribeChannelAction}
    >
      <input name="channelId" type="hidden" value={channelId} />
      <input name="backTo" type="hidden" value={backTo} />
      <button
        className={
          isSubscribed
            ? "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
            : "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
        }
        type="submit"
      >
        {isSubscribed ? (
          <BellOff aria-hidden="true" size={16} />
        ) : (
          <BellPlus aria-hidden="true" size={16} />
        )}
        {isSubscribed ? "取消订阅" : "订阅频道"}
      </button>
    </form>
  )
}

export function SubscriptionNotifyControl({
  backTo,
  channelId,
  notifyEnabled,
}: {
  backTo: string
  channelId: string
  notifyEnabled: boolean
}) {
  return (
    <form action={updateSubscriptionNotifyAction}>
      <input name="channelId" type="hidden" value={channelId} />
      <input name="backTo" type="hidden" value={backTo} />
      <input
        name="notifyEnabled"
        type="hidden"
        value={String(!notifyEnabled)}
      />
      <button
        className={
          notifyEnabled
            ? "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
            : "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-900 hover:text-white"
        }
        type="submit"
      >
        {notifyEnabled ? (
          <BellOff aria-hidden="true" size={15} />
        ) : (
          <BellPlus aria-hidden="true" size={15} />
        )}
        {notifyEnabled ? "关闭通知" : "开启通知"}
      </button>
    </form>
  )
}
