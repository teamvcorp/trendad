"use client";

import { useState } from "react";
import { useAppState } from "@/app/lib/context";
import { GeneratedAd } from "@/app/lib/types";
import AdPreview from "./AdPreview";

type PlatformFilter = "all" | "facebook" | "google" | "youtube";

export default function AdGenerator() {
  const {
    businessInfo,
    selectedTrends,
    generatedAds,
    setGeneratedAds,
    setStep,
  } = useAppState();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PlatformFilter>("all");

  async function generateAds() {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: businessInfo.serviceName,
          description: businessInfo.description,
          prices: businessInfo.prices,
          contactInfo: businessInfo.contactInfo,
          signupUrl: businessInfo.signupUrl,
          trends: selectedTrends.map((t) => ({
            title: t.title,
            source: t.source,
          })),
        }),
      });
      const data = await res.json();
      // Attach image if user provided one
      const adsWithImage = (data.ads || []).map((ad: GeneratedAd) => ({
        ...ad,
        imageUrl: businessInfo.imageFile,
      }));
      setGeneratedAds(adsWithImage);
    } catch {
      setGeneratedAds([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredAds =
    filter === "all"
      ? generatedAds
      : generatedAds.filter((ad) => ad.platform === filter);

  const platformCounts = {
    facebook: generatedAds.filter((a) => a.platform === "facebook").length,
    google: generatedAds.filter((a) => a.platform === "google").length,
    youtube: generatedAds.filter((a) => a.platform === "youtube").length,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2"><span className="brand-gradient-text">Generate Your Ads</span></h2>
        <p className="text-muted">
          Creating ads for{" "}
          <strong>{businessInfo.serviceName}</strong> based on{" "}
          {selectedTrends.length} selected trend
          {selectedTrends.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {/* Selected trends summary */}
      <div className="flex flex-wrap gap-2">
        {selectedTrends.map((t) => (
          <span
            key={t.id}
            className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-medium"
          >
            🔥 {t.title.slice(0, 40)}...
          </span>
        ))}
      </div>

      {generatedAds.length === 0 && (
        <div className="text-center py-12">
          <button
            onClick={generateAds}
            disabled={loading}
            className="px-10 py-4 brand-gradient text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> Generating ads for 3 platforms...
              </span>
            ) : (
              "🎨 Generate Facebook, Google & YouTube Ads"
            )}
          </button>
          <p className="mt-3 text-sm text-muted">
            We&apos;ll create optimized ad copy for each platform and trend combination.
          </p>
        </div>
      )}

      {generatedAds.length > 0 && (
        <>
          {/* Platform filter tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === "all"
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              All ({generatedAds.length})
            </button>
            <button
              onClick={() => setFilter("facebook")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === "facebook"
                  ? "bg-facebook text-white"
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              Facebook ({platformCounts.facebook})
            </button>
            <button
              onClick={() => setFilter("google")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === "google"
                  ? "bg-google text-white"
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              Google ({platformCounts.google})
            </button>
            <button
              onClick={() => setFilter("youtube")}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                filter === "youtube"
                  ? "bg-youtube text-white"
                  : "bg-secondary text-muted hover:text-foreground"
              }`}
            >
              YouTube ({platformCounts.youtube})
            </button>
          </div>

          {/* Ad previews grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
              <div key={ad.id} className="card-hover">
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      ad.platform === "facebook"
                        ? "bg-facebook text-white"
                        : ad.platform === "google"
                        ? "bg-google text-white"
                        : "bg-youtube text-white"
                    }`}
                  >
                    {ad.platform.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted truncate">
                    Based on: {ad.trend.slice(0, 35)}...
                  </span>
                </div>
                <AdPreview ad={ad} />
              </div>
            ))}
          </div>

          {/* Regenerate */}
          <div className="text-center pt-4">
            <button
              onClick={generateAds}
              disabled={loading}
              className="px-6 py-2 text-sm border border-primary text-primary rounded-xl font-semibold hover:bg-primary/10 transition"
            >
              {loading ? "Regenerating..." : "🔄 Regenerate All Ads"}
            </button>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setStep("trends")}
          className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-secondary transition"
        >
          ← Back to Trends
        </button>
        {generatedAds.length > 0 && (
          <button
            onClick={() => setStep("publish")}
            className="flex-1 py-3 rounded-xl font-semibold text-white text-lg bg-primary hover:bg-primary-hover shadow-lg transition-all"
          >
            Publish & Share Ads →
          </button>
        )}
      </div>
    </div>
  );
}
