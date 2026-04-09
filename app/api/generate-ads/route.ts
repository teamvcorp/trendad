import { NextRequest, NextResponse } from "next/server";

interface AdRequest {
  serviceName: string;
  description: string;
  prices: string;
  contactInfo: string;
  signupUrl: string;
  trends: { title: string; source: string }[];
}

interface GeneratedAd {
  id: string;
  platform: "facebook" | "google" | "youtube";
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  trend: string;
  imageUrl: null;
  linkDescription?: string;
  headlines?: string[];
  descriptions?: string[];
  displayUrl?: string;
  finalUrl?: string;
  videoTitle?: string;
  videoDescription?: string;
  companionBannerText?: string;
  targetingKeywords?: string[];
}

function generateFacebookAd(
  trend: { title: string; source: string },
  biz: AdRequest,
  index: number
): GeneratedAd {
  const hooks = [
    `Everyone's talking about ${trend.title.split(" ").slice(0, 5).join(" ")}...`,
    `🔥 This trend is HUGE — and here's how ${biz.serviceName} fits in perfectly.`,
    `${trend.title.split("—")[0].trim()} — see why ${biz.serviceName} is the answer.`,
  ];
  const ctas = ["Sign Up Now", "Learn More", "Get Started", "Book Today"];
  return {
    id: `fb-${index}-${Date.now()}`,
    platform: "facebook",
    headline: `${biz.serviceName} — Join the Movement`,
    primaryText: `${hooks[index % hooks.length]}\n\n${biz.description}\n\n${biz.prices ? `💰 ${biz.prices}` : ""}${biz.signupUrl ? `\n\n👉 ${biz.signupUrl}` : ""}`,
    description: `Inspired by: "${trend.title}" trending on ${trend.source}`,
    callToAction: ctas[index % ctas.length],
    trend: trend.title,
    imageUrl: null,
    linkDescription: `${biz.serviceName} — ${biz.prices || "Check our pricing"}. ${biz.contactInfo || ""}`.trim(),
  };
}

function generateGoogleAd(
  trend: { title: string; source: string },
  biz: AdRequest,
  index: number
): GeneratedAd {
  const trendWords = trend.title.split(" ").slice(0, 4).join(" ");
  const headlines = [
    biz.serviceName.slice(0, 30),
    `${trendWords}`.slice(0, 30),
    `${biz.prices || "Great Value"}`.slice(0, 30),
  ];
  const descs = [
    `${biz.description.slice(0, 80)}. Get started today!`,
    `Trending now: ${trendWords}. ${biz.serviceName} has you covered. ${biz.contactInfo || ""}`.slice(0, 90),
  ];
  const domain = biz.signupUrl
    ? biz.signupUrl.replace(/^https?:\/\//, "").split("/")[0]
    : "yoursite.com";

  return {
    id: `ggl-${index}-${Date.now()}`,
    platform: "google",
    headline: headlines[0],
    primaryText: descs[0],
    description: `Trend-optimized ad for: "${trend.title}"`,
    callToAction: "Visit Site",
    trend: trend.title,
    imageUrl: null,
    headlines,
    descriptions: descs,
    displayUrl: domain,
    finalUrl: biz.signupUrl || `https://${domain}`,
  };
}

function generateYouTubeAd(
  trend: { title: string; source: string },
  biz: AdRequest,
  index: number
): GeneratedAd {
  const trendRef = trend.title.split(" ").slice(0, 6).join(" ");
  const hooks = [
    `${trendRef} — Here's What You Need to Know`,
    `Why Everyone Is Switching to ${biz.serviceName}`,
    `${biz.serviceName}: Join the ${trendRef} Movement`,
  ];
  const videoDescs = [
    `${biz.description}\n\nInspired by the trending topic: "${trend.title}" (${trend.source})\n\n${biz.prices ? `Pricing: ${biz.prices}\n` : ""}${biz.signupUrl ? `Learn more: ${biz.signupUrl}\n` : ""}${biz.contactInfo ? `Contact: ${biz.contactInfo}` : ""}`,
  ];
  const trendKeywords = trend.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  return {
    id: `yt-${index}-${Date.now()}`,
    platform: "youtube",
    headline: hooks[index % hooks.length].slice(0, 100),
    primaryText: `Don't miss out — ${biz.serviceName} is riding the biggest trend right now.`,
    description: `YouTube ad for: "${trend.title}" from ${trend.source}`,
    callToAction: "Watch Now",
    trend: trend.title,
    imageUrl: null,
    videoTitle: hooks[index % hooks.length].slice(0, 100),
    videoDescription: videoDescs[0],
    companionBannerText: `${biz.serviceName} — ${biz.prices || "Get Started Today"}`,
    targetingKeywords: [...new Set([...trendKeywords, biz.serviceName.toLowerCase()])].slice(0, 10),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AdRequest;
    if (!body.serviceName || !body.trends?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Simulate generation time
    await new Promise((resolve) => setTimeout(resolve, 800));

    const ads: GeneratedAd[] = [];
    body.trends.forEach((trend, i) => {
      ads.push(generateFacebookAd(trend, body, i));
      ads.push(generateGoogleAd(trend, body, i));
      ads.push(generateYouTubeAd(trend, body, i));
    });

    return NextResponse.json({ ads });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate ads" },
      { status: 500 }
    );
  }
}
