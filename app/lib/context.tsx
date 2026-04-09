"use client";

import { createContext, useContext, useState, useCallback, ReactNode, Dispatch, SetStateAction } from "react";
import { BusinessInfo, Trend, GeneratedAd, AppStep, SavedCampaign } from "@/app/lib/types";

interface AppState {
  step: AppStep;
  setStep: (step: AppStep) => void;
  businessInfo: BusinessInfo;
  setBusinessInfo: (info: BusinessInfo) => void;
  selectedTrends: Trend[];
  setSelectedTrends: Dispatch<SetStateAction<Trend[]>>;
  generatedAds: GeneratedAd[];
  setGeneratedAds: (ads: GeneratedAd[]) => void;
  // Campaign persistence
  currentCampaignId: string | null;
  setCurrentCampaignId: (id: string | null) => void;
  savedCampaigns: SavedCampaign[];
  refreshCampaigns: () => Promise<void>;
  loadCampaign: (campaign: SavedCampaign) => void;
}

const defaultBusiness: BusinessInfo = {
  serviceName: "",
  description: "",
  prices: "",
  contactInfo: "",
  signupUrl: "",
  productUrl: "",
  imageFile: null,
};

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<AppStep>("input");
  const [businessInfo, setBusinessInfo] =
    useState<BusinessInfo>(defaultBusiness);
  const [selectedTrends, setSelectedTrends] = useState<Trend[]>([]);
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [currentCampaignId, setCurrentCampaignId] = useState<string | null>(null);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);

  const refreshCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setSavedCampaigns(data.campaigns || []);
    } catch {
      // Silently fail if MongoDB is not configured
    }
  }, []);

  const loadCampaign = useCallback((campaign: SavedCampaign) => {
    setCurrentCampaignId(campaign._id);
    setBusinessInfo({
      serviceName: campaign.businessInfo.serviceName,
      description: campaign.businessInfo.description,
      prices: campaign.businessInfo.prices,
      contactInfo: campaign.businessInfo.contactInfo,
      signupUrl: campaign.businessInfo.signupUrl,
      productUrl: campaign.businessInfo.productUrl || "",
      imageFile: campaign.businessInfo.imageUrl,
    });
    setSelectedTrends(campaign.selectedTrends);
    setGeneratedAds(campaign.generatedAds);
    if (campaign.generatedAds.length > 0) {
      setStep("publish");
    } else if (campaign.selectedTrends.length > 0) {
      setStep("ads");
    } else {
      setStep("trends");
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        step,
        setStep,
        businessInfo,
        setBusinessInfo,
        selectedTrends,
        setSelectedTrends,
        generatedAds,
        setGeneratedAds,
        currentCampaignId,
        setCurrentCampaignId,
        savedCampaigns,
        refreshCampaigns,
        loadCampaign,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
