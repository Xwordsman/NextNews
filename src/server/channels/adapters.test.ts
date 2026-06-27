import assert from "node:assert/strict"
import test from "node:test"
import { parseGithubTrendingHtml } from "./github/trending-today"
import { parseWeiboHotSearchHtml } from "./weibo/hot-search"
import { parseZhihuHotListResponse } from "./zhihu/hot-list"

test("parseWeiboHotSearchHtml extracts ranked hot search rows", () => {
  const html = `
    <table>
      <tbody>
        <tr>
          <td class="td-02"><a href="/weibo?q=top&Refer=new_time">置顶话题</a></td>
        </tr>
        <tr>
          <td class="td-01 ranktop">1</td>
          <td class="td-02">
            <a href="/weibo?q=%23NextNews%23&amp;t=31&amp;band_rank=1&amp;Refer=top">NextNews 热搜</a>
            <span>123456</span>
          </td>
          <td class="td-03">热</td>
        </tr>
      </tbody>
    </table>
  `

  const items = parseWeiboHotSearchHtml(html)

  assert.equal(items.length, 1)
  assert.equal(items[0]?.title, "NextNews 热搜")
  assert.equal(items[0]?.rankNo, 1)
  assert.equal(items[0]?.hotValue, "123456")
  assert.equal(items[0]?.tag, "热")
  assert.equal(
    items[0]?.url,
    "https://s.weibo.com/weibo?q=%23NextNews%23&t=31&band_rank=1&Refer=top",
  )
})

test("parseZhihuHotListResponse maps hot-list-web items", () => {
  const items = parseZhihuHotListResponse({
    data: [
      {
        id: "0_1",
        card_id: "Q_123",
        target: {
          id: 123,
          title_area: {
            text: "如何评价 NextNews？",
          },
          excerpt_area: {
            text: "一个新闻聚合系统。",
          },
          image_area: {
            url: "https://pic.example.com/a.jpg",
          },
          metrics_area: {
            text: "100 万热度",
          },
          link: {
            url: "https://api.zhihu.com/questions/123",
          },
        },
      },
    ],
  })

  assert.equal(items.length, 1)
  assert.equal(items[0]?.sourceItemId, "123")
  assert.equal(items[0]?.title, "如何评价 NextNews？")
  assert.equal(items[0]?.url, "https://www.zhihu.com/question/123")
  assert.equal(items[0]?.hotLabel, "100 万热度")
})

test("parseGithubTrendingHtml extracts repositories", () => {
  const html = `
    <main>
      <article>
        <h2>
          <a href="/owner/repo">
            owner
            /
            repo
          </a>
        </h2>
        <p>Repository description.</p>
        <span itemprop="programmingLanguage">TypeScript</span>
        <a href="/owner/repo/stargazers"> 12,345 </a>
        <span>123 stars today</span>
      </article>
    </main>
  `

  const items = parseGithubTrendingHtml(html)

  assert.equal(items.length, 1)
  assert.equal(items[0]?.title, "owner / repo")
  assert.equal(items[0]?.url, "https://github.com/owner/repo")
  assert.equal(items[0]?.summary, "Repository description.")
  assert.equal(items[0]?.tag, "TypeScript")
  assert.equal(items[0]?.hotLabel, "123 stars today")
})
