"use client";

import { useState } from "react";
import { useAppState } from "@/app/lib/context";
import { Trend } from "@/app/lib/types";

export default function TrendDiscovery() {
  const { businessInfo, selectedTrends, setSelectedTrends, setStep } =
    useAppState();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [category, setCategory] = useState("all");
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});

  async function searchTrends() {
    setLoading(true);
    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: businessInfo.serviceName + " " + businessInfo.description,
          category,
        }),
      });
      const data = await res.json();
      setTrends(data.trends || []);
      setSourceCounts(data.sources || {});
      setSearched(true);
    } catch {
      setTrends([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  function toggleTrend(trend: Trend) {
    setSelectedTrends((prev: Trend[]) => {
      const exists = prev.find((t: Trend) => t.id === trend.id);
      if (exists) return prev.filter((t: Trend) => t.id !== trend.id);
      if (prev.length >= 5) return prev;
      return [...prev, trend];
    });
  }

  const isSelected = (id: string) =>
    selectedTrends.some((t: Trend) => t.id === id);

  const sourceColors: Record<string, string> = {
    "Google Trends": "bg-[#4285f4] text-white",
    Reddit: "bg-[#ff4500] text-white",
    YouTube: "bg-youtube text-white",
    "Hacker News": "bg-[#ff6600] text-white",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2"><span className="brand-gradient-text">Discover Viral Trends</span></h2>
        <p className="text-muted">
          We search across social media platforms for trending topics related to{" "}
          <strong>{businessInfo.serviceName}</strong>.
        </p>
      </div>

      {/* Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-1.5">Category Filter</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="fitness">Fitness & Health</option>
            <option value="tech">Technology</option>
            <option value="business">Business & Finance</option>
            <option value="lifestyle">Lifestyle</option>
            <option value="food">Food & Drink</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
          </select>
        </div>
        <button
          onClick={searchTrends}
          disabled={loading}
          className="px-8 py-3 brand-gradient text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⟳</span> Searching...
            </span>
          ) : (
            "🔍 Search Trends"
          )}
        </button>
      </div>

      {/* Platform badges */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-secondary text-muted">
          {searched ? "Live results from:" : "Will search:"}
        </span>
        {["Google Trends", "Reddit", "YouTube", "Hacker News"].map((p) => {
          const key = p === "Google Trends" ? "googleTrends" : p === "Hacker News" ? "hackerNews" : p.toLowerCase();
          const count = sourceCounts[key];
          return (
            <span key={p} className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              sourceColors[p] || "bg-secondary text-muted"
            }`}>
              {p}{count !== undefined ? ` (${count})` : ""}
            </span>
          );
        })}
      </div>
      {searched && Object.keys(sourceCounts).length > 0 && !sourceCounts.youtube && (
        <p className="text-xs text-muted">
          💡 Google Trends + Reddit + Hacker News are always live. Add a <code className="bg-secondary px-1 rounded">YOUTUBE_API_KEY</code> to <code className="bg-secondary px-1 rounded">.env.local</code> for YouTube results.
        </p>
      )}

      {/* Results */}
      {loading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4 animate-pulse-dot">🔥</div>
          <p className="text-muted">Fetching live trends from Google, Reddit, YouTube &amp; Hacker News...</p>
          <p className="text-xs text-muted mt-2">This hits real APIs — may take a few seconds</p>
        </div>
      )}

      {!loading && searched && trends.length === 0 && (
        <div className="text-center py-16 text-muted">
          <div className="text-5xl mb-4">🤷</div>
          <p>No trends found. Try a different category or adjust your business description.</p>
        </div>
      )}

      {!loading && trends.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {trends.length} trends found — select up to 5
            </p>
            <p className="text-sm font-semibold text-primary">
              {selectedTrends.length}/5 selected
            </p>
          </div>

          <div className="grid gap-3">
            {trends.map((trend) => (
              <button
                key={trend.id}
                onClick={() => toggleTrend(trend)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all card-hover
                  ${
                    isSelected(trend.id)
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-white dark:bg-[#1e1535] hover:border-primary/30"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sourceColors[trend.source] || "bg-secondary text-muted"
                        }`}
                      >
                        {trend.source}
                      </span>
                      <span className="text-xs text-muted">{trend.category}</span>
                      <span className="text-xs text-accent font-medium">
                        📈 {trend.volume}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base truncate">{trend.title}</h3>
                    {trend.url && trend.url !== "#" && (
                      <a
                        href={trend.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary hover:underline mt-0.5 inline-block"
                      >
                        View source ↗
                      </a>
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition
                    ${isSelected(trend.id) ? "border-primary bg-primary text-white" : "border-border"}`}
                  >
                    {isSelected(trend.id) && <span className="text-xs">✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setStep("input")}
          className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-secondary transition"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep("ads")}
          disabled={selectedTrends.length === 0}
          className={`flex-1 py-3 rounded-xl font-semibold text-white text-lg transition-all
            ${
              selectedTrends.length > 0
                ? "bg-primary hover:bg-primary-hover shadow-lg"
                : "bg-muted cursor-not-allowed"
            }`}
        >
          Generate Ads with {selectedTrends.length} Trend
          {selectedTrends.length !== 1 ? "s" : ""} →
        </button>
      </div>
    </div>
  );
}
