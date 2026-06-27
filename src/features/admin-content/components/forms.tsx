import Link from "next/link"
import { Save } from "lucide-react"
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"
import {
  channelColorPresetOptions,
  channelDisplayStyleOptions,
  defaultChannelHomeItemLimit,
  getChannelDisplayConfig,
  getChannelFallbackColorPreset,
  maxChannelHomeItemLimit,
  channelTypeOptions,
  type ChannelBadgeMode,
  type ChannelMetaDisplayMode,
} from "@/server/channels/display-config"
import type {
  getAdminCategory,
  getAdminChannel,
  getAdminSite,
  listAdminCategories,
  listChannelFormOptions,
} from "../queries"

type FormAction = (formData: FormData) => Promise<void>
type Site = NonNullable<Awaited<ReturnType<typeof getAdminSite>>>
type Category = NonNullable<Awaited<ReturnType<typeof getAdminCategory>>>
type CategoryOption = Awaited<ReturnType<typeof listAdminCategories>>[number]
type Channel = NonNullable<Awaited<ReturnType<typeof getAdminChannel>>>
type ChannelOptions = Awaited<ReturnType<typeof listChannelFormOptions>>

const metaDisplayOptions: Array<{
  value: ChannelMetaDisplayMode
  label: string
}> = [
  { value: "none", label: "不显示" },
  { value: "auto", label: "自动（热度 / 标签）" },
  { value: "heat", label: "只显示热度" },
  { value: "tag", label: "只显示标签" },
  { value: "time", label: "只显示发布时间" },
]

const badgeModeOptions: Array<{
  value: ChannelBadgeMode
  label: string
}> = [
  { value: "source", label: "跟随来源标签" },
  { value: "none", label: "不显示" },
]

function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-zinc-500">{hint}</p> : null}
    </div>
  )
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 ${
        props.className ?? ""
      }`}
    />
  )
}

function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition-colors focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 ${
        props.className ?? ""
      }`}
    />
  )
}

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 ${
        props.className ?? ""
      }`}
    />
  )
}

function Checkbox({
  label,
  name,
  defaultChecked,
}: {
  label: string
  name: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50">
      <input
        className="size-4 accent-zinc-950"
        defaultChecked={defaultChecked}
        name={name}
        type="checkbox"
      />
      {label}
    </label>
  )
}

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  )
}

function FormActions({
  cancelHref,
  submitLabel,
}: {
  cancelHref: string
  submitLabel: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-4">
      <Link
        className="inline-flex min-h-9 items-center rounded-md border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
        href={cancelHref}
      >
        取消
      </Link>
      <button
        className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md bg-zinc-950 px-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
        type="submit"
      >
        <Save aria-hidden="true" size={16} />
        {submitLabel}
      </button>
    </div>
  )
}

export function SiteForm({
  action,
  site,
  submitLabel,
}: {
  action: FormAction
  site?: Site
  submitLabel: string
}) {
  return (
    <form
      action={action}
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      {site ? <input name="id" type="hidden" value={site.id} /> : null}
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <Field htmlFor="siteName" label="站点名称">
          <Input
            defaultValue={site?.siteName ?? ""}
            id="siteName"
            maxLength={120}
            name="siteName"
            required
          />
        </Field>
        <Field
          htmlFor="slug"
          hint="用于站点页 URL，例如 weibo、github。"
          label="站点 slug"
        >
          <Input
            defaultValue={site?.slug ?? ""}
            id="slug"
            maxLength={160}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </Field>
        <Field htmlFor="homepageUrl" label="官网地址">
          <Input
            defaultValue={site?.homepageUrl ?? ""}
            id="homepageUrl"
            name="homepageUrl"
            type="url"
          />
        </Field>
        <Field htmlFor="logoUrl" label="Logo 地址">
          <Input
            defaultValue={site?.logoUrl ?? ""}
            id="logoUrl"
            name="logoUrl"
            type="url"
          />
        </Field>
        <Field htmlFor="status" label="状态">
          <Select
            defaultValue={site?.status ?? "active"}
            id="status"
            name="status"
          >
            <option value="active">启用</option>
            <option value="draft">草稿</option>
            <option value="disabled">停用</option>
          </Select>
        </Field>
        <Field htmlFor="sort" label="排序">
          <Input
            defaultValue={site?.sort ?? 0}
            id="sort"
            min={0}
            name="sort"
            type="number"
          />
        </Field>
        <div className="lg:col-span-2">
          <Field htmlFor="description" label="站点描述">
            <Textarea
              defaultValue={site?.description ?? ""}
              id="description"
              name="description"
            />
          </Field>
        </div>
        <div className="lg:col-span-2">
          <Checkbox
            defaultChecked={site?.isVisible ?? true}
            label="前台可见"
            name="isVisible"
          />
        </div>
      </div>
      <FormActions cancelHref="/admin/sites" submitLabel={submitLabel} />
    </form>
  )
}

export function CategoryForm({
  action,
  category,
  categories,
  submitLabel,
}: {
  action: FormAction
  category?: Category
  categories: CategoryOption[]
  submitLabel: string
}) {
  const parentOptions = categories.filter((item) => item.id !== category?.id)

  return (
    <form
      action={action}
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <Field htmlFor="categoryName" label="分类名称">
          <Input
            defaultValue={category?.categoryName ?? ""}
            id="categoryName"
            maxLength={120}
            name="categoryName"
            required
          />
        </Field>
        <Field
          htmlFor="slug"
          hint="用于分类 URL 和频道默认分类绑定。"
          label="分类 slug"
        >
          <Input
            defaultValue={category?.slug ?? ""}
            id="slug"
            maxLength={160}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </Field>
        <Field htmlFor="parentId" label="父级分类">
          <Select
            defaultValue={category?.parentId ?? ""}
            id="parentId"
            name="parentId"
          >
            <option value="">无父级</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.categoryName}
              </option>
            ))}
          </Select>
        </Field>
        <Field htmlFor="status" label="状态">
          <Select
            defaultValue={category?.status ?? "active"}
            id="status"
            name="status"
          >
            <option value="active">启用</option>
            <option value="draft">草稿</option>
            <option value="disabled">停用</option>
          </Select>
        </Field>
        <Field htmlFor="icon" label="图标名称">
          <Input
            defaultValue={category?.icon ?? ""}
            id="icon"
            maxLength={80}
            name="icon"
            placeholder="newspaper"
          />
        </Field>
        <Field htmlFor="color" label="颜色">
          <Input
            defaultValue={category?.color ?? "#1E40AF"}
            id="color"
            maxLength={32}
            name="color"
            type="text"
          />
        </Field>
        <Field htmlFor="sort" label="排序">
          <Input
            defaultValue={category?.sort ?? 0}
            id="sort"
            min={0}
            name="sort"
            type="number"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:self-end">
          <Checkbox
            defaultChecked={category?.isNavVisible ?? true}
            label="导航显示"
            name="isNavVisible"
          />
          <Checkbox
            defaultChecked={category?.isHomeVisible ?? true}
            label="首页显示"
            name="isHomeVisible"
          />
        </div>
      </div>
      <FormActions cancelHref="/admin/categories" submitLabel={submitLabel} />
    </form>
  )
}

export function ChannelForm({
  action,
  channel,
  options,
  submitLabel,
}: {
  action: FormAction
  channel?: Channel
  options: ChannelOptions
  submitLabel: string
}) {
  const checkedCategoryIds = new Set(channel?.categoryIds ?? [])
  const fallbackColorPreset = getChannelFallbackColorPreset(
    channel?.definitionKey ?? channel?.slug ?? "nextnews",
  )
  const displayConfig = getChannelDisplayConfig(
    channel?.extra,
    fallbackColorPreset,
  )
  const sectionClassName = "grid gap-5 p-5 lg:grid-cols-2"

  return (
    <form
      action={action}
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
    >
      {channel ? <input name="id" type="hidden" value={channel.id} /> : null}
      <div className="divide-y divide-zinc-100">
        <section className={sectionClassName}>
          <div className="lg:col-span-2">
            <SectionHeader
              description="先确定频道属于哪个站点、前台 URL 是什么，以及由哪个采集定义驱动。"
              title="基础信息"
            />
          </div>
          <Field htmlFor="siteId" label="所属站点">
            <Select
              defaultValue={channel?.siteId ?? ""}
              id="siteId"
              name="siteId"
              required
            >
              <option value="">请选择站点</option>
              {options.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.siteName}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="channelName" label="频道名称">
            <Input
              defaultValue={channel?.channelName ?? ""}
              id="channelName"
              maxLength={160}
              name="channelName"
              required
            />
          </Field>
          <Field
            htmlFor="slug"
            hint="用于频道页 URL，例如 hot-search、trending-today。"
            label="频道 slug"
          >
            <Input
              defaultValue={channel?.slug ?? ""}
              id="slug"
              maxLength={180}
              name="slug"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              required
            />
          </Field>
          <Field htmlFor="status" label="状态">
            <Select
              defaultValue={channel?.status ?? "draft"}
              id="status"
              name="status"
            >
              <option value="draft">草稿</option>
              <option value="active">启用</option>
              <option value="disabled">停用</option>
            </Select>
          </Field>
          <div className="lg:col-span-2">
            <Field
              htmlFor="definitionKey"
              hint="只允许选择代码仓库中已经注册的频道定义，后台不直接写采集代码。"
              label="频道定义"
            >
              <Select
                defaultValue={channel?.definitionKey ?? ""}
                id="definitionKey"
                name="definitionKey"
                required
              >
                <option value="">请选择频道定义</option>
                {options.definitions.map((definition) => (
                  <option key={definition.key} value={definition.key}>
                    {definition.defaults.name} / {definition.key} /{" "}
                    {definition.collectorType === "rss"
                      ? "RSS"
                      : "自定义适配器"}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="lg:col-span-2">
            <Field htmlFor="homepageUrl" label="频道地址">
              <Input
                defaultValue={channel?.homepageUrl ?? ""}
                id="homepageUrl"
                name="homepageUrl"
                type="url"
              />
            </Field>
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="lg:col-span-2">
            <SectionHeader
              description="控制 Worker 如何理解这个频道，以及采集、快照归档的节奏。"
              title="采集与归档"
            />
          </div>
          <Field htmlFor="channelType" label="频道类型">
            <Select
              defaultValue={channel?.channelType ?? "rank"}
              id="channelType"
              name="channelType"
            >
              {channelTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="displayStyle" label="展示样式">
            <Select
              defaultValue={channel?.displayStyle ?? "rank"}
              id="displayStyle"
              name="displayStyle"
            >
              {channelDisplayStyleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="crawlIntervalSeconds" label="采集间隔（秒）">
            <Input
              defaultValue={channel?.crawlIntervalSeconds ?? 300}
              id="crawlIntervalSeconds"
              min={30}
              name="crawlIntervalSeconds"
              type="number"
            />
          </Field>
          <Field
            htmlFor="snapshotIntervalSeconds"
            hint="用于历史归档，默认 7200 秒（2 小时）。采集可以更频繁，快照不必每次都保存。"
            label="快照间隔（秒）"
          >
            <Input
              defaultValue={channel?.snapshotIntervalSeconds ?? 7200}
              id="snapshotIntervalSeconds"
              min={300}
              name="snapshotIntervalSeconds"
              type="number"
            />
          </Field>
          <div className="lg:col-span-2">
            <Checkbox
              defaultChecked={channel?.isCrawlEnabled ?? false}
              label="启用采集"
              name="isCrawlEnabled"
            />
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="lg:col-span-2">
            <SectionHeader
              description="控制这个频道是否进入前台、首页和用户订阅体系。"
              title="前台发布"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 xl:grid-cols-3">
            <Checkbox
              defaultChecked={channel?.isPublic ?? true}
              label="前台公开"
              name="isPublic"
            />
            <Checkbox
              defaultChecked={channel?.isHomeVisible ?? false}
              label="首页展示"
              name="isHomeVisible"
            />
            <Checkbox
              defaultChecked={channel?.isSubscribable ?? true}
              label="允许订阅"
              name="isSubscribable"
            />
          </div>
          <Field htmlFor="weight" label="首页权重">
            <Input
              defaultValue={channel?.weight ?? 0}
              id="weight"
              min={0}
              name="weight"
              type="number"
            />
          </Field>
          <Field htmlFor="sort" label="排序">
            <Input
              defaultValue={channel?.sort ?? 0}
              id="sort"
              min={0}
              name="sort"
              type="number"
            />
          </Field>
        </section>

        <section className={sectionClassName}>
          <div className="lg:col-span-2">
            <SectionHeader
              description="控制首页频道卡片的副标题、颜色，以及每条内容下面显示什么信息。"
              title="首页卡片"
            />
          </div>
          <Field
            htmlFor="displaySubtitle"
            hint="显示在首页卡片标题右侧，例如：热搜、实时热搜、Trending。"
            label="频道副标题"
          >
            <Input
              defaultValue={displayConfig.subtitle ?? ""}
              id="displaySubtitle"
              maxLength={40}
              name="displaySubtitle"
              placeholder="热搜"
            />
          </Field>
          <Field
            htmlFor="displayItemLimit"
            hint="控制首页卡片最多显示多少条，不影响采集、入库和历史快照。"
            label="首页条数"
          >
            <Input
              defaultValue={displayConfig.itemLimit}
              id="displayItemLimit"
              max={maxChannelHomeItemLimit}
              min={1}
              name="displayItemLimit"
              placeholder={String(defaultChannelHomeItemLimit)}
              type="number"
            />
          </Field>
          <Field htmlFor="displayColorPreset" label="颜色预设">
            <Select
              defaultValue={displayConfig.colorPreset}
              id="displayColorPreset"
              name="displayColorPreset"
            >
              {channelColorPresetOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            htmlFor="displayMeta"
            hint="控制每条内容标题下方显示什么。没有热度数据的资讯类频道建议选择“不显示”。"
            label="条目副信息"
          >
            <Select
              defaultValue={displayConfig.metaDisplay}
              id="displayMeta"
              name="displayMeta"
            >
              {metaDisplayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            htmlFor="displayBadge"
            hint="根据采集到的 hotLabel 或 tag 判断；包含“新 / 爆 / 热”时才显示，也可以关闭。"
            label="条目角标"
          >
            <Select
              defaultValue={displayConfig.badgeMode}
              id="displayBadge"
              name="displayBadge"
            >
              {badgeModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="lg:col-span-2">
            <Checkbox
              defaultChecked={displayConfig.showUpdatedAt}
              label="显示卡片更新时间"
              name="displayUpdatedAt"
            />
          </div>
        </section>

        <section className={sectionClassName}>
          <div className="lg:col-span-2">
            <SectionHeader
              description="一个频道可以出现在多个分类里，前台分类页和导航会使用这些绑定。"
              title="所属分类"
            />
          </div>
          <div className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {options.categories.map((category) => (
                <label
                  className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                  key={category.id}
                >
                  <input
                    className="size-4 accent-zinc-950"
                    defaultChecked={checkedCategoryIds.has(category.id)}
                    name="categoryIds"
                    type="checkbox"
                    value={category.id}
                  />
                  {category.categoryName}
                </label>
              ))}
              {options.categories.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  还没有分类，可以先保存频道，稍后再补分类。
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
      <FormActions cancelHref="/admin/channels" submitLabel={submitLabel} />
    </form>
  )
}
