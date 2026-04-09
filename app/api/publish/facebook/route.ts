import { NextRequest, NextResponse } from "next/server";

// Facebook Graph API — create ad post
// Requires a Facebook Page Access Token with pages_manage_posts permission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, pageId, message, link, imageUrl } = body as {
      accessToken: string;
      pageId: string;
      message: string;
      link?: string;
      imageUrl?: string;
    };

    if (!accessToken || !pageId || !message) {
      return NextResponse.json(
        { error: "accessToken, pageId, and message are required" },
        { status: 400 }
      );
    }

    let result;

    if (imageUrl) {
      // Post with photo
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrl,
            message,
            access_token: accessToken,
          }),
        }
      );
      result = await res.json();
      if (result.error) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }
    } else {
      // Post with link or text only
      const payload: Record<string, string> = {
        message,
        access_token: accessToken,
      };
      if (link) payload.link = link;

      const res = await fetch(
        `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      result = await res.json();
      if (result.error) {
        return NextResponse.json(
          { error: result.error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      postId: result.id || result.post_id,
      platform: "facebook",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to publish to Facebook" },
      { status: 500 }
    );
  }
}
