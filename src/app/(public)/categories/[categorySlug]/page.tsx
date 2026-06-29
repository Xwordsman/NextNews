import { notFound } from "next/navigation"
import { PublicHomePage } from "@/features/public-home/components/public-home-page"
import { getPublicCategoryHomeData } from "@/features/public-home/queries"

export const dynamic = "force-dynamic"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params
  const result = await getPublicCategoryHomeData(categorySlug)

  if (!result) {
    notFound()
  }

  return (
    <PublicHomePage
      activePath={`/categories/${result.category.slug}`}
      categoryNavItems={result.data.categoryNavItems}
      homeModules={result.data.homeModules}
      initialSources={result.data.sources}
    />
  )
}
