import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsed: URL;
    try {
      parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Step 1: Fetch the webpage content
    let pageText = "";
    try {
      const res = await fetch(parsed.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; TrendAds/1.0; +https://trendads.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(10_000),
        redirect: "follow",
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Could not fetch URL (status ${res.status})` },
          { status: 422 }
        );
      }

      const html = await res.text();

      // Strip HTML tags, scripts, styles to get text content
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 8000); // Keep first ~8K chars for Gemini context window
    } catch {
      return NextResponse.json(
        { error: "Could not fetch the URL — is the site accessible?" },
        { status: 422 }
      );
    }

    // Step 2: Use Gemini to extract business info
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback: basic extraction without Gemini
      return NextResponse.json({
        extracted: {
          serviceName: parsed.hostname.replace("www.", ""),
          description: pageText.slice(0, 300),
          prices: "",
          contactInfo: "",
        },
        source: "basic",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a marketing copywriter analyzing a business website to prepare an ad campaign.

Read the webpage content below and produce polished, ad-ready business information. Do NOT just copy-paste raw text — rewrite and summarize intelligently.

Return ONLY valid JSON with these fields:
{
  "serviceName": "The official product or business name (short, clean — no taglines or slogans)",
  "description": "Write a compelling 2-3 sentence marketing description. Highlight the core value proposition, key benefits, and what makes this business unique. Write in third person. Make it persuasive and concise — suitable for ad copy.",
  "prices": "Summarize pricing clearly (e.g. 'Starting at $29/mo', 'Free plan available, Pro at $49/mo'). If no pricing found, return empty string.",
  "contactInfo": "Extract the most useful contact method — email, phone number, or physical address. Format cleanly. If none found, return empty string.",
  "signupUrl": "Find the best sign-up, get-started, or purchase URL. Look for links labeled sign up, get started, try free, buy now, etc. Return the full URL. If none found, return empty string."
}

IMPORTANT RULES:
- For description: Do NOT dump raw page text. Synthesize the information into a polished marketing paragraph.
- For contactInfo: Only include actual contact details (email, phone, address), not social media links.
- For signupUrl: Return a full absolute URL (starting with https://). If you find a relative path, prepend the site's domain.
- If information for a field is genuinely not available, return an empty string.

Website: ${parsed.hostname}
Webpage content:
${pageText}`;

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (geminiErr: unknown) {
      console.error("[scrape-url] Gemini API error:", geminiErr);
      // Fallback to basic extraction if Gemini fails (bad key, quota, etc.)
      return NextResponse.json({
        extracted: {
          serviceName: parsed.hostname.replace("www.", ""),
          description: pageText.slice(0, 300),
          prices: "",
          contactInfo: "",
        },
        source: "basic",
        warning: `Gemini unavailable: ${geminiErr instanceof Error ? geminiErr.message : "unknown error"}`,
      });
    }

    const text = result.response.text();

    // Parse the JSON from Gemini's response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        extracted: {
          serviceName: parsed.hostname.replace("www.", ""),
          description: pageText.slice(0, 300),
          prices: "",
          contactInfo: "",
        },
        source: "basic",
      });
    }

    const extracted = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      extracted: {
        serviceName: String(extracted.serviceName || "").slice(0, 200),
        description: String(extracted.description || "").slice(0, 500),
        prices: String(extracted.prices || "").slice(0, 200),
        contactInfo: String(extracted.contactInfo || "").slice(0, 200),
        signupUrl: String(extracted.signupUrl || "").slice(0, 500),
      },
      source: "gemini",
    });
  } catch (err) {
    console.error("[scrape-url] Unexpected error:", err);
    return NextResponse.json(
      { error: "Failed to extract info from URL" },
      { status: 500 }
    );
  }
}
