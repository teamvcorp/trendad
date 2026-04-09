"use client";

import { GeneratedAd } from "@/app/lib/types";

function FacebookPreview({ ad }: { ad: GeneratedAd }) {
  return (
    <div className="bg-white dark:bg-[#1e1535] rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-facebook flex items-center justify-center text-white font-bold text-sm">
            FB
          </div>
          <div>
            <p className="font-semibold text-sm">{ad.headline}</p>
            <p className="text-xs text-muted">Sponsored · 📍</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm whitespace-pre-line mb-3">{ad.primaryText}</p>
      </div>
      {ad.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl} alt="Ad" className="w-full object-cover max-h-64" />
      )}
      {!ad.imageUrl && (
        <div className="w-full h-48 bg-gradient-to-br from-facebook/20 to-facebook/5 flex items-center justify-center text-4xl">
          📸
        </div>
      )}
      <div className="p-4 border-t border-border bg-secondary/30">
        <p className="text-xs text-muted uppercase tracking-wide mb-1">
          {ad.linkDescription || "yoursite.com"}
        </p>
        <p className="font-semibold text-sm">{ad.headline}</p>
        <button className="mt-2 px-4 py-1.5 bg-facebook text-white text-sm rounded font-semibold">
          {ad.callToAction}
        </button>
      </div>
    </div>
  );
}

function GooglePreview({ ad }: { ad: GeneratedAd }) {
  return (
    <div className="bg-white dark:bg-[#1e1535] rounded-xl border border-border p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold bg-google text-white px-1.5 py-0.5 rounded">Ad</span>
        <span className="text-sm text-accent">{ad.displayUrl || "yoursite.com"}</span>
      </div>
      <div className="space-y-1">
        {(ad.headlines || [ad.headline]).map((h, i) => (
          <span key={i} className="text-lg text-[#1a0dab] dark:text-[#8ab4f8] font-medium hover:underline cursor-pointer">
            {h}
            {i < (ad.headlines?.length || 1) - 1 && " | "}
          </span>
        ))}
      </div>
      <div className="mt-2 space-y-1">
        {(ad.descriptions || [ad.primaryText]).map((d, i) => (
          <p key={i} className="text-sm text-muted">{d}</p>
        ))}
      </div>
      {ad.finalUrl && (
        <p className="mt-2 text-xs text-muted">Final URL: {ad.finalUrl}</p>
      )}
    </div>
  );
}

function YouTubePreview({ ad }: { ad: GeneratedAd }) {
  return (
    <div className="bg-white dark:bg-[#1e1535] rounded-xl border border-border overflow-hidden">
      {/* Video thumbnail area */}
      <div className="relative w-full h-48 bg-gradient-to-br from-youtube/20 to-youtube/5 flex items-center justify-center">
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="Ad thumbnail" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-2">▶️</div>
            <p className="text-sm text-muted">Video Ad Preview</p>
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="bg-youtube text-white text-xs font-bold px-2 py-0.5 rounded">Ad</span>
          <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">0:15</span>
        </div>
        <div className="absolute bottom-2 right-2">
          <button className="bg-youtube text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-red-700 transition">
            {ad.callToAction} →
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base mb-1">{ad.videoTitle || ad.headline}</h3>
        <p className="text-sm text-muted whitespace-pre-line line-clamp-3">
          {ad.videoDescription || ad.primaryText}
        </p>
        {ad.companionBannerText && (
          <div className="mt-3 p-2 bg-secondary rounded-lg text-sm">
            <span className="text-xs text-muted block mb-0.5">Companion Banner:</span>
            <span className="font-medium">{ad.companionBannerText}</span>
          </div>
        )}
        {ad.targetingKeywords && ad.targetingKeywords.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-xs text-muted">Keywords:</span>
            {ad.targetingKeywords.map((kw, i) => (
              <span key={i} className="px-2 py-0.5 bg-youtube/10 text-youtube text-xs rounded-full">
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdPreview({ ad }: { ad: GeneratedAd }) {
  if (ad.platform === "facebook") return <FacebookPreview ad={ad} />;
  if (ad.platform === "google") return <GooglePreview ad={ad} />;
  if (ad.platform === "youtube") return <YouTubePreview ad={ad} />;
  return null;
}
