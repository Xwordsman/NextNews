import { BellPlus, BellOff } from "lucide-react"
import {
  subscribeChannelAction,
  unsubscribeChannelAction,
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
