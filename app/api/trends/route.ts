import { NextRequest, NextResponse } from "next/server";

interface TrendResult {
  id: string;
  title: string;
  source: string;
  category: string;
  volume: string;
  url: string;
}

// ── Google Trends (Daily trending searches — RSS, free, no key) ─────────
async function fetchGoogleTrends(geo: string): Promise<TrendResult[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`,
      { headers: { "User-Agent": "TrendAds/1.0" }, signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    if (!res.ok) return [];
    const xml = await res.text();

    const items: TrendResult[] = [];
    // Simple XML parsing — each <item> has <title> and <ht:approx_traffic>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let idx = 0;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const title = block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
        ?? block.match(/<title>(.*?)<\/title>/)?.[1]
        ?? "";
      const traffic =
        block.match(/<ht:approx_traffic>(.*?)<\/ht:approx_traffic>/)?.[1] ?? "";
      const link =
        block.match(/<link>(.*?)<\/link>/)?.[1] ?? "";
      if (title) {
        items.push({
          id: `gtrend-${idx++}`,
          title: title.trim(),
          source: "Google Trends",
          category: "Trending",
          volume: traffic || "Trending now",
          url: link || `https://trends.google.com/trending?geo=${geo}`,
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

// ── Reddit (public JSON — no auth required) ─────────────────────────────
async function fetchRedditTrends(query: string): Promise<TrendResult[]> {
  try {
    // Search Reddit for the query, sorted by hot / recent
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=hot&t=week&limit=15`;
    const res = await fetch(url, {
      headers: { "User-Agent": "TrendAds/1.0 (trend-research)" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();

    const posts = json?.data?.children ?? [];
    return posts.map(
      (child: { data: { id: string; title: string; subreddit: string; score: number; permalink: string } }, i: number) => {
        const d = child.data;
        return {
          id: `reddit-${i}`,
          title: d.title,
          source: "Reddit",
          category: `r/${d.subreddit}`,
          volume: `${formatNumber(d.score)} upvotes`,
          url: `https://www.reddit.com${d.permalink}`,
        };
      }
    );
  } catch {
    return [];
  }
}

// ── YouTube (Data API v3 — free tier: 10 000 units/day) ─────────────────
async function fetchYouTubeTrends(query: string): Promise<TrendResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[YouTube] No YOUTUBE_API_KEY env var found");
    return [];
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=viewCount&publishedAfter=${recentISO()}&maxResults=10&q=${encodeURIComponent(query)}&key=${apiKey}`;
    console.log("[YouTube] Fetching:", url.replace(apiKey, "***"));
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[YouTube] API error", res.status, errText);
      return [];
    }
    const json = await res.json();
    console.log("[YouTube] Got", json.items?.length ?? 0, "results");

    return (json.items ?? []).map(
      (item: { id: { videoId: string }; snippet: { title: string; channelTitle: string } }, i: number) => ({
        id: `yt-${i}`,
        title: item.snippet.title,
        source: "YouTube",
        category: item.snippet.channelTitle,
        volume: "Recent & popular",
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      })
    );
  } catch (err) {
    console.error("[YouTube] Fetch exception:", err);
    return [];
  }
}

// ── Hacker News (free, no key — good for tech/business) ─────────────────
async function fetchHackerNewsTrends(): Promise<TrendResult[]> {
  try {
    const res = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
      { signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    if (!res.ok) return [];
    const ids: number[] = await res.json();

    // Fetch top 12 story details in parallel
    const stories = await Promise.all(
      ids.slice(0, 12).map(async (id) => {
        const r = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { signal: AbortSignal.timeout(5000), cache: "no-store" }
        );
        return r.ok ? r.json() : null;
      })
    );

    return stories
      .filter(Boolean)
      .map((s: { id: number; title: string; score: number; url?: string }, i: number) => ({
        id: `hn-${i}`,
        title: s.title,
        source: "Hacker News",
        category: "Tech",
        volume: `${formatNumber(s.score)} points`,
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
      }));
  } catch {
    return [];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function recentISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString();
}

// ── Main handler ────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, category } = body as { query: string; category: string };

    if (!query || typeof query !== "string") {
      return NextResponse.json({ trends: [] });
    }

    // Fetch all sources in parallel for speed
    const [google, reddit, youtube, hn] = await Promise.all([
      fetchGoogleTrends("US"),
      fetchRedditTrends(query),
      fetchYouTubeTrends(query),
      fetchHackerNewsTrends(),
    ]);

    let allTrends: TrendResult[] = [...google, ...reddit, ...youtube, ...hn];

    // Category filtering (map user categories to likely sources)
    if (category && category !== "all") {
      const categorySourceMap: Record<string, string[]> = {
        tech: ["Hacker News", "Reddit", "YouTube"],
        business: ["Hacker News", "Reddit", "Google Trends"],
        fitness: ["Reddit", "YouTube", "Google Trends"],
        lifestyle: ["Reddit", "YouTube", "Google Trends"],
        food: ["Reddit", "YouTube", "Google Trends"],
        education: ["Reddit", "YouTube", "Hacker News"],
        entertainment: ["Reddit", "YouTube", "Google Trends"],
      };
      const allowedSources = categorySourceMap[category];
      if (allowedSources) {
        allTrends = allTrends.filter((t) => allowedSources.includes(t.source));
      }
    }

    // Score by relevance to the user's query
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = allTrends.map((trend) => {
      const text = (trend.title + " " + trend.category).toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += 3;
      }
      // Boost by source diversity
      if (trend.source === "Google Trends") score += 2;
      if (trend.source === "YouTube") score += 1;
      return { ...trend, _score: score };
    });

    scored.sort((a, b) => b._score - a._score);

    // Deduplicate similar titles
    const seen = new Set<string>();
    const unique = scored.filter((t) => {
      const key = t.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const topTrends = unique
      .slice(0, 20)
      .map(({ _score, ...rest }) => rest);

    return NextResponse.json({
      trends: topTrends,
      sources: {
        googleTrends: google.length,
        reddit: reddit.length,
        youtube: youtube.length,
        hackerNews: hn.length,
      },
    });
  } catch {
    return NextResponse.json({ trends: [] }, { status: 500 });
  }
}
