export interface BusinessInfo {
  serviceName: string;
  description: string;
  prices: string;
  contactInfo: string;
  signupUrl: string;
  productUrl: string;
  imageFile: string | null; // base64 data URL or blob URL
}

export interface SavedCampaign {
  _id: string;
  name: string;
  businessInfo: BusinessInfo & { imageUrl: string | null };
  selectedTrends: Trend[];
  generatedAds: GeneratedAd[];
  publishStatus: { facebook: boolean; google: boolean; youtube: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface Trend {
  id: string;
  title: string;
  source: string;
  category: string;
  volume: string;
  url: string;
}

export interface GeneratedAd {
  id: string;
  platform: "facebook" | "google" | "youtube";
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  trend: string;
  imageUrl: string | null;
  // Facebook specific
  linkDescription?: string;
  // Google specific
  headlines?: string[];
  descriptions?: string[];
  displayUrl?: string;
  finalUrl?: string;
  // YouTube specific
  videoTitle?: string;
  videoDescription?: string;
  companionBannerText?: string;
  targetingKeywords?: string[];
}

export type AppStep = "input" | "trends" | "ads" | "publish";

export interface PublishTokens {
  facebook?: { accessToken: string; pageId: string; pageName: string };
  youtube?: { accessToken: string; channelId: string };
}
