import { ObjectId } from "mongodb";

export interface CampaignDoc {
  _id?: ObjectId;
  name: string;
  businessInfo: {
    serviceName: string;
    description: string;
    prices: string;
    contactInfo: string;
    signupUrl: string;
    productUrl: string;
    imageUrl: string | null; // Vercel Blob URL
  };
  selectedTrends: {
    id: string;
    title: string;
    source: string;
    category: string;
    volume: string;
    url: string;
  }[];
  generatedAds: {
    id: string;
    platform: "facebook" | "google" | "youtube";
    headline: string;
    primaryText: string;
    description: string;
    callToAction: string;
    trend: string;
    imageUrl: string | null;
    linkDescription?: string;
    headlines?: string[];
    descriptions?: string[];
    displayUrl?: string;
    finalUrl?: string;
    videoTitle?: string;
    videoDescription?: string;
    companionBannerText?: string;
    targetingKeywords?: string[];
  }[];
  publishStatus: {
    facebook: boolean;
    google: boolean;
    youtube: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
