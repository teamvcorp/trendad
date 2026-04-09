"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SocialTokens {
  facebook: { accessToken: string; pageId: string };
  youtube: { accessToken: string };
  google: { note: string };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [tokens, setTokens] = useState<SocialTokens>({
    facebook: { accessToken: "", pageId: "" },
    youtube: { accessToken: "" },
    google: { note: "Manual posting only" },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.socialTokens) setTokens(data.socialTokens);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialTokens: tokens }),
      });
      if (res.ok) {
        setMsg({ type: "success", text: "Tokens saved! They'll auto-fill when you publish." });
      } else {
        setMsg({ type: "error", text: "Failed to save" });
      }
    } catch {
      setMsg({ type: "error", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border py-4 px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold"><img src="/1024Logo.png" alt="TrendAd" className="h-8" /></Link>
        <span className="text-sm text-muted">{session?.user?.email}</span>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold"><span className="brand-gradient-text">Profile &amp; Saved Tokens</span></h1>
          <p className="text-muted text-sm mt-1">
            Save your social media tokens here so you don&apos;t have to re-enter them every time.
          </p>
        </div>

        {/* Facebook */}
        <div className="bg-white dark:bg-[#1e1535] rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-facebook flex items-center justify-center text-white text-sm">f</span>
            Facebook
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Page Access Token</label>
              <input
                type="password"
                value={tokens.facebook.accessToken}
                onChange={(e) => setTokens((t) => ({ ...t, facebook: { ...t.facebook, accessToken: e.target.value } }))}
                placeholder="From me/accounts response"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-facebook"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Page ID</label>
              <input
                type="text"
                value={tokens.facebook.pageId}
                onChange={(e) => setTokens((t) => ({ ...t, facebook: { ...t.facebook, pageId: e.target.value } }))}
                placeholder="From me/accounts response"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-facebook"
              />
            </div>
          </div>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-foreground font-medium">How to get these?</summary>
            <ol className="mt-2 ml-4 space-y-1 list-decimal">
              <li>Create a Facebook App at <a href="https://developers.facebook.com/apps/create/" target="_blank" rel="noopener noreferrer" className="text-facebook underline">developers.facebook.com</a> — select &quot;Other&quot; → type &quot;None&quot; (do NOT connect a Business Portfolio)</li>
              <li>Go to <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-facebook underline">Graph API Explorer</a>, select your app</li>
              <li>Add permissions: <code className="bg-secondary px-1 rounded">pages_manage_posts</code> + <code className="bg-secondary px-1 rounded">pages_read_engagement</code> + <code className="bg-secondary px-1 rounded">pages_show_list</code></li>
              <li>Click &quot;Generate Access Token&quot; and authorize</li>
              <li>Query <code className="bg-secondary px-1 rounded">me/accounts</code> → copy the <code className="bg-secondary px-1 rounded">access_token</code> and <code className="bg-secondary px-1 rounded">id</code> from the response</li>
            </ol>
          </details>
        </div>

        {/* YouTube */}
        <div className="bg-white dark:bg-[#1e1535] rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-youtube flex items-center justify-center text-white text-sm">▶</span>
            YouTube
          </h2>
          <div>
            <label className="text-xs text-muted block mb-1">OAuth2 Access Token</label>
            <input
              type="password"
              value={tokens.youtube.accessToken}
              onChange={(e) => setTokens((t) => ({ ...t, youtube: { accessToken: e.target.value } }))}
              placeholder="From Google OAuth Playground"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-youtube"
            />
          </div>
          <details className="text-xs text-muted">
            <summary className="cursor-pointer hover:text-foreground font-medium">How to get this?</summary>
            <ol className="mt-2 ml-4 space-y-1 list-decimal">
              <li>Go to <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="text-youtube underline">OAuth Playground</a></li>
              <li>Authorize with scope: <code className="bg-secondary px-1 rounded">https://www.googleapis.com/auth/youtube</code></li>
              <li>Exchange for access token and paste here</li>
            </ol>
          </details>
        </div>

        {/* Google Ads */}
        <div className="bg-white dark:bg-[#1e1535] rounded-2xl border border-border p-6">
          <h2 className="font-bold flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-google flex items-center justify-center text-white text-sm">G</span>
            Google Ads
          </h2>
          <p className="text-sm text-muted mt-2">
            Google Ads requires a developer token for API access. Use the &quot;Copy Ad Text&quot; feature and paste directly into{" "}
            <a href="https://ads.google.com/aw/campaigns/new" target="_blank" rel="noopener noreferrer" className="text-google underline font-medium">Google Ads Manager</a>.
          </p>
        </div>

        {/* Save */}
        {msg && (
          <div className={`p-3 rounded-xl text-sm ${
            msg.type === "success"
              ? "bg-accent/10 text-accent border border-accent/20"
              : "bg-red-50 text-red-600 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
          }`}>
            {msg.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "💾 Save Tokens"}
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-secondary text-foreground font-semibold hover:bg-border transition"
          >
            ← Back to App
          </Link>
        </div>
      </main>
    </div>
  );
}
