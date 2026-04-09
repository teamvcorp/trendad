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

    const prompt = `Analyze this webpage content and extract business information for creating an ad campaign. Return ONLY valid JSON with these fields:
{
  "serviceName": "the product or service name",
  "description": "a compelling 2-3 sentence description of what they offer and key benefits",
  "prices": "any pricing information found (or empty string if none)",
  "contactInfo": "any contact info like email, phone (or empty string if none)"
}

Webpage content from ${parsed.hostname}:
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
