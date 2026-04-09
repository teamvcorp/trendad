"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/app/lib/context";
import { SavedCampaign } from "@/app/lib/types";

export default function CampaignManager() {
  const {
    savedCampaigns,
    refreshCampaigns,
    loadCampaign,
    businessInfo,
    selectedTrends,
    generatedAds,
    currentCampaignId,
    setCurrentCampaignId,
  } = useAppState();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  useEffect(() => {
    refreshCampaigns();
  }, [refreshCampaigns]);

  async function saveCampaign() {
    if (!businessInfo.serviceName.trim()) {
      setError("Fill in business info first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const name =
        campaignName.trim() || `${businessInfo.serviceName} Campaign`;

      if (currentCampaignId) {
        // Update existing
        const res = await fetch("/api/campaigns", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentCampaignId,
            name,
            businessInfo: {
              ...businessInfo,
              productUrl: businessInfo.productUrl || "",
              imageUrl: businessInfo.imageFile,
            },
            selectedTrends,
            generatedAds,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      } else {
        // Create new
        if (savedCampaigns.length >= 3) {
          setError("Maximum 3 campaigns. Delete one first.");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/campaigns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            businessInfo: {
              ...businessInfo,
              productUrl: businessInfo.productUrl || "",
              imageUrl: businessInfo.imageFile,
            },
            selectedTrends,
            generatedAds,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setCurrentCampaignId(data.campaign._id);
      }
      await refreshCampaigns();
      setShowSaveDialog(false);
      setCampaignName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign(id: string) {
    setDeleting(id);
    setError(null);
    try {
      await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (currentCampaignId === id) {
        setCurrentCampaignId(null);
      }
      await refreshCampaigns();
    } catch {
      setError("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const canSave = businessInfo.serviceName.trim().length > 0;

  return (
    <div className="bg-white dark:bg-[#1e1535] rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          💾 Saved Campaigns
          <span className="text-xs text-muted font-normal">
            ({savedCampaigns.length}/3)
          </span>
        </h3>
        {canSave && (
          <button
            onClick={() => setShowSaveDialog(true)}
            className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover transition"
          >
            {currentCampaignId ? "💾 Update" : "+ Save Current"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-danger mb-2 bg-danger/10 px-3 py-1.5 rounded">
          {error}
        </p>
      )}

      {showSaveDialog && (
        <div className="mb-3 p-3 bg-secondary rounded-lg">
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder={`${businessInfo.serviceName} Campaign`}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white dark:bg-[#110d1d] text-sm outline-none focus:ring-2 focus:ring-primary mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={saveCampaign}
              disabled={saving}
              className="px-4 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setCampaignName("");
              }}
              className="px-4 py-1.5 bg-secondary border border-border rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {savedCampaigns.length === 0 && (
        <p className="text-xs text-muted py-2">
          No saved campaigns yet. Fill in your business info and save to get started.
        </p>
      )}

      <div className="space-y-2">
        {savedCampaigns.map((c: SavedCampaign) => (
          <div
            key={c._id}
            className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer hover:bg-secondary/50 ${
              currentCampaignId === c._id
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <button
              onClick={() => loadCampaign(c)}
              className="flex-1 text-left min-w-0"
            >
              <p className="font-semibold text-sm truncate">{c.name}</p>
              <p className="text-xs text-muted">
                {c.businessInfo.serviceName} · {c.generatedAds.length} ads ·{" "}
                {c.selectedTrends.length} trends
              </p>
              <p className="text-xs text-muted">
                Updated {new Date(c.updatedAt).toLocaleDateString()}
              </p>
            </button>
            <div className="flex gap-1 flex-shrink-0">
              {c.publishStatus?.facebook && (
                <span className="w-5 h-5 rounded-full bg-facebook text-white text-[10px] flex items-center justify-center">
                  f
                </span>
              )}
              {c.publishStatus?.google && (
                <span className="w-5 h-5 rounded-full bg-google text-white text-[10px] flex items-center justify-center">
                  G
                </span>
              )}
              {c.publishStatus?.youtube && (
                <span className="w-5 h-5 rounded-full bg-youtube text-white text-[10px] flex items-center justify-center">
                  ▶
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCampaign(c._id);
                }}
                disabled={deleting === c._id}
                className="w-5 h-5 rounded-full bg-danger/10 text-danger text-[10px] flex items-center justify-center hover:bg-danger/20 ml-1"
                title="Delete campaign"
              >
                {deleting === c._id ? "…" : "✕"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
