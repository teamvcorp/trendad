"use client";

import { AppProvider, useAppState } from "@/app/lib/context";
import Stepper from "@/app/components/Stepper";
import BusinessForm from "@/app/components/BusinessForm";
import TrendDiscovery from "@/app/components/TrendDiscovery";
import AdGenerator from "@/app/components/AdGenerator";
import PublishPanel from "@/app/components/PublishPanel";
import CampaignManager from "@/app/components/CampaignManager";

function AppContent() {
  const { step } = useAppState();

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      <Stepper />
      <main className="flex-1 py-8 px-4 sm:px-6">
        <CampaignManager />
        {step === "input" && <BusinessForm />}
        {step === "trends" && <TrendDiscovery />}
        {step === "ads" && <AdGenerator />}
        {step === "publish" && <PublishPanel />}
      </main>
      <footer className="border-t border-border py-4 text-center text-xs text-muted">
        <span className="brand-gradient-text font-semibold">TrendAd</span> — Find viral trends, create ads, publish everywhere.
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
