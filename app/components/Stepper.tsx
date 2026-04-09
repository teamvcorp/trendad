"use client";

import { useAppState } from "@/app/lib/context";
import { AppStep } from "@/app/lib/types";
import UserMenu from "./UserMenu";
import Image from "next/image";

const steps: { key: AppStep; label: string; icon: string }[] = [
  { key: "input", label: "Business Info", icon: "📝" },
  { key: "trends", label: "Find Trends", icon: "🔥" },
  { key: "ads", label: "Generate Ads", icon: "🎨" },
  { key: "publish", label: "Publish", icon: "🚀" },
];

export default function Stepper() {
  const { step, setStep, businessInfo } = useAppState();

  const currentIndex = steps.findIndex((s) => s.key === step);

  function canNavigateTo(targetStep: AppStep) {
    const targetIndex = steps.findIndex((s) => s.key === targetStep);
    if (targetIndex === 0) return true;
    if (targetIndex === 1) return businessInfo.serviceName.trim().length > 0;
    if (targetIndex >= 2) return businessInfo.serviceName.trim().length > 0;
    return false;
  }

  return (
    <nav className="w-full bg-white dark:bg-[#1e1535] border-b border-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/1024Logo.png"
              alt="TrendAd"
              width={420}
              height={120}
              className="h-[108px] w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            {steps.map((s, i) => {
              const isActive = s.key === step;
              const isPast = i < currentIndex;
              const clickable = canNavigateTo(s.key);

              return (
                <button
                  key={s.key}
                  onClick={() => clickable && setStep(s.key)}
                  disabled={!clickable}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${isActive ? "brand-gradient text-white shadow-md" : ""}
                    ${isPast && !isActive ? "bg-success/10 text-success" : ""}
                    ${!isActive && !isPast ? "text-muted" : ""}
                    ${clickable ? "cursor-pointer hover:bg-primary/10" : "cursor-not-allowed opacity-50"}
                  `}
                >
                  <span className="hidden sm:inline">{s.icon}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                  <span className="sm:hidden text-lg">{s.icon}</span>
                  {isPast && <span className="text-success text-xs">✓</span>}
                </button>
              );
            })}
          </div>
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
