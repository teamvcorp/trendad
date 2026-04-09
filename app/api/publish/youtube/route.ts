import { NextRequest, NextResponse } from "next/server";

// YouTube publish — posts as a community post or creates a video ad stub
// For actual video ad campaigns, use Google Ads (YouTube ads are managed there)
// For community posts, requires YouTube Data API with OAuth2

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, channelId, text, imageUrl } = body as {
      accessToken: string;
      channelId?: string;
      text: string;
      imageUrl?: string;
    };

    if (!accessToken || !text) {
      return NextResponse.json(
        { error: "accessToken and text are required" },
        { status: 400 }
      );
    }

    // Attempt YouTube community post via Activities API
    // Note: YouTube community posts have limited API support
    // The most reliable path is creating video ads via Google Ads API
    const payload: Record<string, unknown> = {
      snippet: {
        channelId: channelId || "mine",
        description: text,
        ...(imageUrl ? { thumbnails: { default: { url: imageUrl } } } : {}),
      },
    };

    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/activities?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();

    if (result.error) {
      // Fall back to guidance
      return NextResponse.json({
        success: false,
        method: "manual",
        error: result.error.message,
        message:
          "YouTube video ad campaigns are created through Google Ads. " +
          "For community posts, visit your YouTube Studio directly.",
        links: {
          youtubeStudio: "https://studio.youtube.com",
          googleAds: "https://ads.google.com/aw/campaigns/new",
        },
      });
    }

    return NextResponse.json({
      success: true,
      activityId: result.id,
      platform: "youtube",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to publish to YouTube" },
      { status: 500 }
    );
  }
}
