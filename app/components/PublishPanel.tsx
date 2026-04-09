"use client";

import { useState, useEffect } from "react";
import { useAppState } from "@/app/lib/context";
import { useSession } from "next-auth/react";
import AdPreview from "./AdPreview";

type PlatformTab = "facebook" | "google" | "youtube";

const platformGuides: Record<
  PlatformTab,
  { loginUrl: string; createAdUrl: string; steps: string[]; tips: string[] }
> = {
  facebook: {
    loginUrl: "https://www.facebook.com/login",
    createAdUrl: "https://www.facebook.com/ads/manager",
    steps: [
      "Create a Facebook App at developers.facebook.com/apps/create/ â€” select 'Other' then 'None' as app type",
      "Go to Graph API Explorer (developers.facebook.com/tools/explorer/)",
      "Select your app, then add permissions: pages_manage_posts, pages_read_engagement, pages_show_list",
      "Click 'Generate Access Token' and authorize",
      "Run 'me/accounts' in the Explorer to get your Page token and Page ID",
      "Paste the Page Access Token and Page ID into the fields above",
      "Click 'ðŸš€ Publish' on any ad card to post directly to your Facebook Page!",
      "For paid ads: go to Ads Manager (facebook.com/ads/manager) and paste your ad copy there",
    ],
    tips: [
      "App type must be 'None' â€” Business and Consumer types don't include pages_manage_posts",
      "Page tokens from the Explorer are short-lived (~1 hour). For longer tokens, exchange via the Token Debugger",
      "Use Facebook Business Suite for easier organic post management",
      "For paid ads, start with a $5-10/day budget to test",
      "Use 1200x628px images for best results",
      "Install the Facebook Pixel on your website for tracking",
    ],
  },
  google: {
    loginUrl: "https://ads.google.com",
    createAdUrl: "https://ads.google.com/aw/campaigns/new",
    steps: [
      "Go to Google Ads (ads.google.com)",
      "Click '+ New Campaign'",
      "Choose campaign goal (Sales, Leads, or Website traffic)",
      "Select 'Search' campaign type",
      "Set your target locations and languages",
      "Set daily budget (start with $10-20/day)",
      "Add your keywords (use the targeting keywords we suggest)",
      "Create your ad group with the headlines and descriptions below",
      "Add your final URL (sign-up link)",
      "Review and launch!",
    ],
    tips: [
      "Use 'Responsive Search Ads' â€” Google will mix & match headlines",
      "Add at least 10 headlines and 4 descriptions for best results",
      "Use negative keywords to avoid irrelevant clicks",
      "Enable 'Smart Bidding' to let Google optimize automatically",
      "Connect Google Analytics for full conversion tracking",
      "Check Search Terms report weekly to refine keywords",
    ],
  },
  youtube: {
    loginUrl: "https://ads.google.com",
    createAdUrl: "https://ads.google.com/aw/campaigns/new",
    steps: [
      "YouTube Ads are managed through Google Ads (ads.google.com)",
      "Click '+ New Campaign' then choose your goal",
      "Select 'Video' as campaign type",
      "Choose 'Skippable in-stream' or 'In-feed video' ad format",
      "Upload your video ad to YouTube first (can be unlisted)",
      "Set targeting: demographics, interests, and keywords from below",
      "Set your bid strategy and daily budget",
      "Paste the companion banner text and destination URL",
      "Add your call-to-action button text",
      "Review and launch your video campaign!",
    ],
    tips: [
      "Hook viewers in the first 5 seconds â€” that's before they can skip",
      "Keep video ads 15-30 seconds for best engagement",
      "Use captions â€” 85% of videos are watched without sound",
      "Add end screens and cards linking to your sign-up page",
      "Target competitor channel audiences for relevant viewers",
      "Use bumper ads (6 sec) for brand awareness on a budget",
      "Create a compelling thumbnail if using in-feed ads",
    ],
  },
};

export default function PublishPanel() {
  const { generatedAds, businessInfo, setStep } = useAppState();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<PlatformTab>("facebook");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<PlatformTab | null>(null);

  // Publish-from-app state
  const [fbToken, setFbToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [ytToken, setYtToken] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<Record<string, { success: boolean; message: string }>>({});
  const [editedText, setEditedText] = useState<Record<string, string>>({});
  const [adImageUrls, setAdImageUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [tokensLoaded, setTokensLoaded] = useState(false);

  // Auto-load saved tokens from user profile
  useEffect(() => {
    if (!session || tokensLoaded) return;
    setTokensLoaded(true);
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.socialTokens?.facebook?.accessToken) setFbToken(data.socialTokens.facebook.accessToken);
        if (data.socialTokens?.facebook?.pageId) setFbPageId(data.socialTokens.facebook.pageId);
        if (data.socialTokens?.youtube?.accessToken) setYtToken(data.socialTokens.youtube.accessToken);
      })
      .catch(() => {});
  }, [session, tokensLoaded]);
  const [defaultImageUploaded, setDefaultImageUploaded] = useState(false);

  const platformAds = generatedAds.filter((a) => a.platform === activeTab);
  const guide = platformGuides[activeTab];

  // Auto-upload the business info image to Vercel Blob and set as default for all ads
  useEffect(() => {
    if (defaultImageUploaded || !businessInfo.imageFile) return;
    setDefaultImageUploaded(true);

    // If it's already a URL (not base64), use directly
    if (businessInfo.imageFile.startsWith("http")) {
      const defaults: Record<string, string> = {};
      for (const ad of generatedAds) defaults[ad.id] = businessInfo.imageFile;
      setAdImageUrls(defaults);
      return;
    }

    // Convert base64 to blob and upload
    (async () => {
      try {
        const res = await fetch(businessInfo.imageFile!);
        const blob = await res.blob();
        const file = new File([blob], "business-image.png", { type: blob.type });
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await uploadRes.json();
        if (data.url) {
          const defaults: Record<string, string> = {};
          for (const ad of generatedAds) defaults[ad.id] = data.url;
          setAdImageUrls(defaults);
        }
      } catch {
        // Silently fail â€” user can still upload manually
      }
    })();
  }, [businessInfo.imageFile, defaultImageUploaded, generatedAds]);

  function getEditedText(ad: (typeof generatedAds)[0]) {
    return editedText[ad.id] ?? getAdCopyText(ad);
  }

  async function saveTokensToProfile() {
    if (!session) return;
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          socialTokens: {
            facebook: { accessToken: fbToken, pageId: fbPageId },
            youtube: { accessToken: ytToken },
          },
        }),
      });
    } catch {
      // silent
    }
  }

  async function handleImageUpload(adId: string, file: File) {
    setUploading(adId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.url) {
        setAdImageUrls((prev) => ({ ...prev, [adId]: data.url }));
      } else {
        setPublishResult((prev) => ({ ...prev, [adId]: { success: false, message: data.error || "Upload failed" } }));
      }
    } catch {
      setPublishResult((prev) => ({ ...prev, [adId]: { success: false, message: "Image upload failed" } }));
    } finally {
      setUploading(null);
    }
  }

  async function publishToFacebook(adId: string, message: string, link?: string, imageUrl?: string) {
    if (!fbToken || !fbPageId) {
      setPublishResult((p) => ({ ...p, [adId]: { success: false, message: "Enter your Facebook Page Access Token and Page ID above" } }));
      return;
    }
    setPublishing(adId);
    try {
      const res = await fetch("/api/publish/facebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: fbToken, pageId: fbPageId, message, link, imageUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishResult((p) => ({ ...p, [adId]: { success: true, message: `Published! Post ID: ${data.postId}` } }));
      } else {
        setPublishResult((p) => ({ ...p, [adId]: { success: false, message: data.error || "Failed to publish" } }));
      }
    } catch {
      setPublishResult((p) => ({ ...p, [adId]: { success: false, message: "Network error" } }));
    } finally {
      setPublishing(null);
    }
  }

  async function publishToYouTube(adId: string, text: string, imageUrl?: string) {
    if (!ytToken) {
      setPublishResult((p) => ({ ...p, [adId]: { success: false, message: "Enter your YouTube/Google OAuth token above" } }));
      return;
    }
    setPublishing(adId);
    try {
      const res = await fetch("/api/publish/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: ytToken, text, imageUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishResult((p) => ({ ...p, [adId]: { success: true, message: "Published to YouTube!" } }));
      } else {
        setPublishResult((p) => ({ ...p, [adId]: { success: false, message: data.message || data.error || "See manual steps below" } }));
      }
    } catch {
      setPublishResult((p) => ({ ...p, [adId]: { success: false, message: "Network error" } }));
    } finally {
      setPublishing(null);
    }
  }

  async function publishToGoogle(adId: string) {
    setPublishing(adId);
    try {
      const res = await fetch("/api/publish/google", { method: "POST" });
      const data = await res.json();
      setPublishResult((p) => ({ ...p, [adId]: { success: false, message: data.message } }));
    } catch {
      setPublishResult((p) => ({ ...p, [adId]: { success: false, message: "Network error" } }));
    } finally {
      setPublishing(null);
    }
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function getAdCopyText(ad: (typeof generatedAds)[0]) {
    if (ad.platform === "facebook") {
      return `HEADLINE: ${ad.headline}\n\nPRIMARY TEXT:\n${ad.primaryText}\n\nLINK DESCRIPTION: ${ad.linkDescription || ""}\n\nCALL TO ACTION: ${ad.callToAction}\n\nDESTINATION URL: ${businessInfo.signupUrl || ""}`;
    }
    if (ad.platform === "google") {
      return `HEADLINES:\n${(ad.headlines || [ad.headline]).map((h, i) => `  ${i + 1}. ${h}`).join("\n")}\n\nDESCRIPTIONS:\n${(ad.descriptions || [ad.primaryText]).map((d, i) => `  ${i + 1}. ${d}`).join("\n")}\n\nDISPLAY URL: ${ad.displayUrl || ""}\nFINAL URL: ${ad.finalUrl || businessInfo.signupUrl || ""}`;
    }
    if (ad.platform === "youtube") {
      return `VIDEO TITLE: ${ad.videoTitle || ad.headline}\n\nVIDEO DESCRIPTION:\n${ad.videoDescription || ad.primaryText}\n\nCOMPANION BANNER: ${ad.companionBannerText || ""}\n\nCALL TO ACTION: ${ad.callToAction}\n\nTARGETING KEYWORDS: ${(ad.targetingKeywords || []).join(", ")}\n\nDESTINATION URL: ${businessInfo.signupUrl || ""}`;
    }
    return ad.primaryText;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2"><span className="brand-gradient-text">Publish Your Ads</span></h2>
        <p className="text-muted">
          Copy your ad content and follow the guides to post on each platform.
        </p>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2">
        {(["facebook", "google", "youtube"] as PlatformTab[]).map((p) => {
          const count = generatedAds.filter((a) => a.platform === p).length;
          const colors = {
            facebook: "bg-facebook",
            google: "bg-google",
            youtube: "bg-youtube",
          };
          return (
            <button
              key={p}
              onClick={() => setActiveTab(p)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition ${
                activeTab === p
                  ? `${colors[p]} text-white shadow-md`
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              {p === "facebook" ? "ðŸ“˜" : p === "google" ? "ðŸ”" : "â–¶ï¸"}{" "}
              {p.charAt(0).toUpperCase() + p.slice(1)} ({count})
            </button>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href={guide.loginUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary hover:bg-border transition text-sm font-medium"
        >
          ðŸ”‘ Log in to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          {activeTab === "youtube" ? " (via Google Ads)" : ""}
        </a>
        <a
          href={guide.createAdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition text-sm font-medium"
        >
          âž• Create New {activeTab === "youtube" ? "Video" : ""} Ad Campaign
        </a>
        <button
          onClick={() =>
            setExpandedGuide(expandedGuide === activeTab ? null : activeTab)
          }
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition text-sm font-medium"
        >
          ðŸ“– {expandedGuide === activeTab ? "Hide" : "Show"} Step-by-Step Guide
        </button>
      </div>

      {/* Publish from app â€” token inputs */}
      {activeTab === "facebook" && (
        <div className="bg-facebook/5 border border-facebook/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            ðŸ“˜ Publish directly to Facebook
            <span className="text-xs text-muted font-normal">(requires Page Access Token from <code className="bg-secondary px-1 rounded">me/accounts</code>)</span>
          </h4>
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-xs space-y-1">
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">âš ï¸ Required permissions: <code className="bg-secondary px-1 rounded">pages_manage_posts</code> + <code className="bg-secondary px-1 rounded">pages_read_engagement</code></p>
            <p className="text-yellow-600 dark:text-yellow-500">Both the Page Access Token and Page ID must come from the <code className="bg-secondary px-1 rounded">me/accounts</code> Graph API response â€” do NOT use the User Access Token from the top of the Explorer.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Page Access Token <span className="text-yellow-600">(from me/accounts response)</span></label>
              <input
                type="password"
                value={fbToken}
                onChange={(e) => setFbToken(e.target.value)}
                placeholder="Paste access_token from me/accounts"
                className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-[#110d1d] text-sm outline-none focus:ring-2 focus:ring-facebook"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Page ID <span className="text-yellow-600">(from me/accounts response)</span></label>
              <input
                type="text"
                value={fbPageId}
                onChange={(e) => setFbPageId(e.target.value)}
                placeholder="Paste id from me/accounts"
                className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-[#110d1d] text-sm outline-none focus:ring-2 focus:ring-facebook"
              />
            </div>
          </div>
          <details className="text-xs text-muted" open>
            <summary className="cursor-pointer hover:text-foreground font-medium">How to get a Page Access Token?</summary>
            <div className="mt-2 space-y-3">
              <p className="font-semibold text-foreground">Step 1: Create a Facebook App with type &quot;None&quot;</p>
              <ol className="ml-4 space-y-1 list-decimal">
                <li>Go to <a href="https://developers.facebook.com/apps/create/" target="_blank" rel="noopener noreferrer" className="text-facebook underline">Create a New App</a></li>
                <li>Select <strong>&quot;Other&quot;</strong> â†’ then select app type <strong>&quot;None&quot;</strong></li>
                <li>Do <strong>NOT</strong> connect a Business Portfolio</li>
                <li>Name it anything and click Create</li>
              </ol>

              <p className="font-semibold text-foreground">Step 2: Add permissions &amp; generate User token</p>
              <ol className="ml-4 space-y-1 list-decimal">
                <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-facebook underline">Graph API Explorer</a></li>
                <li>Select your new app from the <strong>&quot;Facebook App&quot;</strong> dropdown</li>
                <li>Click <strong>&quot;Add a Permission&quot;</strong> and add: <code className="bg-secondary px-1 rounded">pages_manage_posts</code>, <code className="bg-secondary px-1 rounded">pages_read_engagement</code>, <code className="bg-secondary px-1 rounded">pages_show_list</code></li>
                <li>Click <strong>&quot;Generate Access Token&quot;</strong> and authorize all permissions</li>
              </ol>

              <p className="font-semibold text-foreground">Step 3: Get Page token &amp; ID from <code className="bg-secondary px-1 rounded">me/accounts</code></p>
              <ol className="ml-4 space-y-1 list-decimal">
                <li>In the Explorer query field, type <code className="bg-secondary px-1 rounded font-bold">me/accounts</code> and click <strong>Submit</strong></li>
                <li>The JSON response lists your Pages â€” each has <code className="bg-secondary px-1 rounded">access_token</code> and <code className="bg-secondary px-1 rounded">id</code></li>
                <li>Copy the <code className="bg-secondary px-1 rounded">access_token</code> value â†’ paste into <strong>&quot;Page Access Token&quot;</strong> above</li>
                <li>Copy the <code className="bg-secondary px-1 rounded">id</code> value â†’ paste into <strong>&quot;Page ID&quot;</strong> above</li>
              </ol>

              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-2 mt-2">
                <p className="text-red-600 dark:text-red-400 font-semibold">Common mistakes:</p>
                <ul className="ml-4 list-disc text-red-600 dark:text-red-400 mt-1 space-y-0.5">
                  <li>Using the User token from the top of the Explorer instead of the Page token from <code className="bg-secondary px-1 rounded">me/accounts</code></li>
                  <li>App type is &quot;Business&quot; or &quot;Consumer&quot; â€” <code className="bg-secondary px-1 rounded">pages_manage_posts</code> won&apos;t be available</li>
                  <li>Connecting a Business Portfolio during app creation â€” don&apos;t do this</li>
                  <li>Not granting both <code className="bg-secondary px-1 rounded">pages_manage_posts</code> AND <code className="bg-secondary px-1 rounded">pages_read_engagement</code></li>
                </ul>
              </div>
            </div>
          </details>
          {session && fbToken && fbPageId && (
            <button
              onClick={saveTokensToProfile}
              className="text-xs px-3 py-1.5 rounded-lg bg-facebook/10 text-facebook hover:bg-facebook/20 transition font-medium"
            >
              ðŸ’¾ Save tokens to profile
            </button>
          )}
        </div>
      )}

      {activeTab === "youtube" && (
        <div className="bg-youtube/5 border border-youtube/20 rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            â–¶ï¸ Publish to YouTube
            <span className="text-xs text-muted font-normal">(requires OAuth2 token)</span>
          </h4>
          <div>
            <label className="text-xs text-muted block mb-1">OAuth2 Access Token</label>
            <input
              type="password"
              value={ytToken}
              onChange={(e) => setYtToken(e.target.value)}
              placeholder="Your YouTube/Google OAuth2 bearer token"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-[#110d1d] text-sm outline-none focus:ring-2 focus:ring-youtube"
            />
          </div>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-foreground">How to get a YouTube OAuth token?</summary>
            <ol className="mt-2 ml-4 space-y-1 list-decimal">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-youtube underline">Google Cloud Console</a></li>
              <li>Create OAuth2 credentials (Web application type)</li>
              <li>Use the OAuth2 Playground: <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="text-youtube underline">OAuth Playground</a></li>
              <li>Authorize with scope: <code className="bg-secondary px-1 rounded">https://www.googleapis.com/auth/youtube</code></li>
              <li>Exchange the authorization code for an access token</li>
            </ol>
          </details>
          {session && ytToken && (
            <button
              onClick={saveTokensToProfile}
              className="text-xs px-3 py-1.5 rounded-lg bg-youtube/10 text-youtube hover:bg-youtube/20 transition font-medium"
            >
              ðŸ’¾ Save token to profile
            </button>
          )}
        </div>
      )}

      {activeTab === "google" && (
        <div className="bg-google/5 border border-google/20 rounded-xl p-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            ðŸ” Google Ads â€” Manual Posting
          </h4>
          <p className="text-xs text-muted mt-1">
            Google Ads requires a developer token and OAuth2 for API access. Use the &quot;Copy Ad Text&quot; button below and paste into{" "}
            <a href="https://ads.google.com/aw/campaigns/new" target="_blank" rel="noopener noreferrer" className="text-google underline font-medium">Google Ads Manager</a>.
          </p>
        </div>
      )}

      {/* Step-by-step guide */}
      {expandedGuide === activeTab && (
        <div className="bg-white dark:bg-[#1e1535] rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-bold text-lg">
            How to Post on{" "}
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            {activeTab === "youtube" ? " (via Google Ads)" : ""}
          </h3>
          <ol className="space-y-2">
            {guide.steps.map((step, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="border-t border-border pt-4">
            <h4 className="font-semibold text-sm mb-2">ðŸ’¡ Pro Tips</h4>
            <ul className="space-y-1.5">
              {guide.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex gap-2 items-start text-sm text-muted"
                >
                  <span className="text-accent">â€¢</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Ad cards with copy buttons */}
      <div className="space-y-6">
        {platformAds.map((ad) => (
          <div
            key={ad.id}
            className="bg-white dark:bg-[#1e1535] rounded-xl border border-border overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted">
                  Based on trend: <strong>{ad.trend.slice(0, 50)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(getEditedText(ad), ad.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                    copiedId === ad.id
                      ? "bg-accent text-white"
                      : "bg-primary text-white hover:bg-primary-hover"
                  }`}
                >
                  {copiedId === ad.id ? "âœ“ Copied!" : "ðŸ“‹ Copy Ad Text"}
                </button>
                {activeTab === "facebook" && fbToken && fbPageId && (
                  <button
                    onClick={() => publishToFacebook(ad.id, getEditedText(ad), businessInfo.signupUrl, adImageUrls[ad.id] || undefined)}
                    disabled={publishing === ad.id}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-facebook text-white hover:bg-facebook/80 transition disabled:opacity-50"
                  >
                    {publishing === ad.id ? "Publishing..." : "ðŸš€ Publish"}
                  </button>
                )}
                {activeTab === "youtube" && ytToken && (
                  <button
                    onClick={() => publishToYouTube(ad.id, getEditedText(ad), adImageUrls[ad.id] || undefined)}
                    disabled={publishing === ad.id}
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-youtube text-white hover:bg-youtube/80 transition disabled:opacity-50"
                  >
                    {publishing === ad.id ? "Publishing..." : "ðŸš€ Publish"}
                  </button>
                )}
              </div>
            </div>
            {publishResult[ad.id] && (
              <div className={`mx-4 mt-2 p-3 rounded-lg text-sm ${
                publishResult[ad.id].success
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
              }`}>
                {publishResult[ad.id].success ? "âœ… " : "âŒ "}{publishResult[ad.id].message}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4 p-4">
              {/* Preview */}
              <div>
                <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-2">
                  Preview
                </p>
                <AdPreview ad={ad} />
              </div>
              {/* Editable ad copy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted uppercase font-semibold tracking-wide">
                    Ad Copy â€” edit below to fix typos
                  </p>
                  {editedText[ad.id] && (
                    <button
                      onClick={() => setEditedText((prev) => { const n = { ...prev }; delete n[ad.id]; return n; })}
                      className="text-xs text-muted hover:text-foreground"
                    >
                      â†© Reset
                    </button>
                  )}
                </div>
                <textarea
                  value={getEditedText(ad)}
                  onChange={(e) => setEditedText((prev) => ({ ...prev, [ad.id]: e.target.value }))}
                  className="w-full bg-secondary rounded-xl p-4 text-xs whitespace-pre-wrap font-mono leading-relaxed min-h-[200px] max-h-80 resize-y border border-border outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Image upload */}
            <div className="px-4 pb-4">
              <div className="border border-dashed border-border rounded-xl p-4">
                {adImageUrls[ad.id] ? (
                  <div className="flex items-center gap-3">
                    <img src={adImageUrls[ad.id]} alt="Ad image" className="w-20 h-20 object-cover rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-accent">Image uploaded</p>
                      <p className="text-xs text-muted truncate">{adImageUrls[ad.id]}</p>
                    </div>
                    <button
                      onClick={() => setAdImageUrls((prev) => { const n = { ...prev }; delete n[ad.id]; return n; })}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded"
                    >
                      âœ• Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 cursor-pointer">
                    <span className="text-2xl">{uploading === ad.id ? "â³" : "ðŸ–¼ï¸"}</span>
                    <span className="text-sm text-muted">
                      {uploading === ad.id ? "Uploading..." : "Click to attach an image (PNG, JPG, WebP â€” max 5MB)"}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploading === ad.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(ad.id, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {platformAds.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p>No ads generated for this platform yet.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setStep("ads")}
          className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-secondary transition"
        >
          â† Back to Ads
        </button>
        <button
          onClick={() => setStep("input")}
          className="flex-1 py-3 rounded-xl font-semibold border-2 border-primary text-primary text-lg hover:bg-primary/10 transition"
        >
          ðŸ”„ Start New Campaign
        </button>
      </div>
    </div>
  );
}
