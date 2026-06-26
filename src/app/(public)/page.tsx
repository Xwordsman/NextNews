import { PublicHomePage } from "@/features/public-home/components/public-home-page"
import { getPublicHomeData } from "@/features/public-home/queries"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const data = await getPublicHomeData()

  return (
    <PublicHomePage
      categoryNavItems={data.categoryNavItems}
      homeModules={data.homeModules}
      initialSources={data.sources}
    />
  )
}
