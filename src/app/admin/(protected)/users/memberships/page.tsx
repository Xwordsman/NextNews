import {
  AdminAlert,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminSection,
  AdminTable,
  BooleanBadge,
  RunButton,
  StatusBadge,
  formatDateTime,
} from "@/features/admin-content/components/admin-ui"
import { saveMembershipPlanAction } from "@/features/admin-content/actions"
import {
  listAdminMembershipOrders,
  listAdminMembershipPlans,
} from "@/features/admin-content/queries"
import {
  getErrorMessage,
  getNoticeMessage,
  type AdminSearchParams,
} from "@/features/admin-content/search-params"

export const dynamic = "force-dynamic"

export default async function AdminMembershipsPage({
  searchParams,
}: {
  searchParams: AdminSearchParams
}) {
  const [plans, orders, errorMessage, noticeMessage] = await Promise.all([
    listAdminMembershipPlans(),
    listAdminMembershipOrders(),
    getErrorMessage(searchParams),
    getNoticeMessage(searchParams),
  ])

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description="管理可售会员套餐和支付订单预留。是否在前台启用商业化，由基础设置中的“会员商业化”开关控制。"
        eyebrow="Membership"
        title="会员商业化"
      />
      <AdminAlert message={errorMessage} />
      <AdminNotice message={noticeMessage} />

      <AdminSection>
        <form action={saveMembershipPlanAction} className="grid gap-4 p-5">
          <input name="backTo" type="hidden" value="/admin/users/memberships" />
          <div>
            <h2 className="text-base font-semibold">新增套餐</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              套餐保存后不会自动展示给前台，仍受系统商业化开关和套餐启用状态共同控制。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className={inputClassName}
              name="planKey"
              placeholder="pro"
            />
            <input
              className={inputClassName}
              name="planName"
              placeholder="Pro 会员"
            />
            <input
              className={inputClassName}
              min={0}
              name="priceCents"
              placeholder="价格，单位分"
              type="number"
            />
            <input
              className={inputClassName}
              defaultValue="CNY"
              name="currency"
              placeholder="币种"
            />
            <input
              className={inputClassName}
              defaultValue={365}
              min={1}
              name="historyDays"
              placeholder="历史天数"
              type="number"
            />
            <input
              className={inputClassName}
              defaultValue={365}
              min={1}
              name="durationDays"
              placeholder="有效天数"
              type="number"
            />
            <select
              className={inputClassName}
              defaultValue="true"
              name="isEnabled"
            >
              <option value="true">启用</option>
              <option value="false">停用</option>
            </select>
            <select
              className={inputClassName}
              defaultValue="false"
              name="isFeatured"
            >
              <option value="true">推荐</option>
              <option value="false">普通</option>
            </select>
          </div>
          <textarea
            className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"
            name="description"
            placeholder="套餐说明"
          />
          <div className="flex justify-end">
            <RunButton label="保存套餐" />
          </div>
        </form>
      </AdminSection>

      <AdminSection>
        {plans.length === 0 ? (
          <AdminEmptyState
            description="还没有会员套餐。新增套餐后，可在前台商业化开启时展示。"
            title="暂无会员套餐"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">套餐</th>
                <th className="px-5 py-3">价格</th>
                <th className="px-5 py-3">权益</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">快速编辑</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {plans.map((plan) => (
                <tr className="hover:bg-slate-50/80" key={plan.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{plan.planName}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {plan.planKey}
                    </div>
                    {plan.description ? (
                      <p className="mt-2 max-w-[420px] text-sm leading-6 text-slate-500">
                        {plan.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatMoney(plan.priceCents, plan.currency)}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {plan.historyDays} 天历史 / {plan.durationDays} 天有效期
                  </td>
                  <td className="px-5 py-4">
                    <div className="grid gap-2">
                      <BooleanBadge
                        active={plan.isEnabled}
                        activeLabel="已启用"
                        inactiveLabel="已停用"
                      />
                      <BooleanBadge
                        active={plan.isFeatured}
                        activeLabel="推荐"
                        inactiveLabel="普通"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <form
                      action={saveMembershipPlanAction}
                      className="grid min-w-[520px] gap-2"
                    >
                      <input name="id" type="hidden" value={plan.id} />
                      <input
                        name="backTo"
                        type="hidden"
                        value="/admin/users/memberships"
                      />
                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          className={inputClassName}
                          defaultValue={plan.planKey}
                          name="planKey"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={plan.planName}
                          name="planName"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={plan.priceCents}
                          min={0}
                          name="priceCents"
                          type="number"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={plan.sort}
                          name="sort"
                          type="number"
                        />
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <input
                          className={inputClassName}
                          defaultValue={plan.currency}
                          name="currency"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={plan.historyDays}
                          min={1}
                          name="historyDays"
                          type="number"
                        />
                        <input
                          className={inputClassName}
                          defaultValue={plan.durationDays}
                          min={1}
                          name="durationDays"
                          type="number"
                        />
                        <select
                          className={inputClassName}
                          defaultValue={String(plan.isEnabled)}
                          name="isEnabled"
                        >
                          <option value="true">启用</option>
                          <option value="false">停用</option>
                        </select>
                      </div>
                      <input
                        name="description"
                        type="hidden"
                        value={plan.description ?? ""}
                      />
                      <select
                        className={inputClassName}
                        defaultValue={String(plan.isFeatured)}
                        name="isFeatured"
                      >
                        <option value="true">推荐</option>
                        <option value="false">普通</option>
                      </select>
                      <RunButton label="保存" />
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>

      <AdminSection>
        {orders.length === 0 ? (
          <AdminEmptyState
            description="前台用户选择套餐后会生成待支付订单。实际支付网关可以后续接入。"
            title="暂无会员订单"
          />
        ) : (
          <AdminTable>
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-5 py-3">用户</th>
                <th className="px-5 py-3">套餐</th>
                <th className="px-5 py-3">金额</th>
                <th className="px-5 py-3">状态</th>
                <th className="px-5 py-3">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => (
                <tr className="hover:bg-slate-50/80" key={order.id}>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{order.userDisplayName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {order.userEmail}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold">{order.planName}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {order.planKey}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatMoney(order.amountCents, order.currency)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">
                    创建：{formatDateTime(order.createdAt)}
                    <br />
                    支付：{formatDateTime(order.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminSection>
    </div>
  )
}

const inputClassName =
  "min-h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition-colors focus:border-slate-400"

function formatMoney(priceCents: number, currency: string) {
  return `${currency} ${(priceCents / 100).toFixed(2)}`
}
