"use client";

import { useState, useRef } from "react";
import { useAppState } from "@/app/lib/context";

export default function BusinessForm() {
  const { businessInfo, setBusinessInfo, setStep } = useAppState();
  const [imagePreview, setImagePreview] = useState<string | null>(
    businessInfo.imageFile
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(businessInfo);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setForm((prev) => ({ ...prev, imageFile: result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleScrapeUrl() {
    if (!form.productUrl.trim()) return;
    setScraping(true);
    setScrapeMsg(null);
    try {
      const res = await fetch("/api/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.productUrl }),
      });
      const data = await res.json();
      if (data.error) {
        setScrapeMsg(`⚠️ ${data.error}`);
        return;
      }
      const ext = data.extracted;
      setForm((prev) => ({
        ...prev,
        serviceName: ext.serviceName || prev.serviceName,
        description: ext.description || prev.description,
        prices: ext.prices || prev.prices,
        contactInfo: ext.contactInfo || prev.contactInfo,
        signupUrl: ext.signupUrl || prev.signupUrl,
      }));
      setScrapeMsg(
        data.source === "gemini"
          ? "✅ Gemini extracted business info from the page!"
          : "✅ Basic info extracted (add GEMINI_API_KEY for smarter extraction)"
      );
    } catch {
      setScrapeMsg("⚠️ Could not fetch that URL");
    } finally {
      setScraping(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.serviceName.trim() || !form.description.trim()) return;
    setBusinessInfo(form);
    setStep("trends");
  }

  const isValid = form.serviceName.trim() && form.description.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2"><span className="brand-gradient-text">Tell us about your business</span></h2>
        <p className="text-muted">
          We&apos;ll use this info to create targeted ads that match viral trends.
        </p>
      </div>

      {/* Product URL auto-fill */}
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
        <label className="block text-sm font-semibold mb-1.5">
          🔗 Product / Service URL <span className="text-xs text-muted font-normal">(auto-fill with AI)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={form.productUrl}
            onChange={(e) => updateField("productUrl", e.target.value)}
            placeholder="https://yourproduct.com — we'll pull info automatically"
            className="flex-1 px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          />
          <button
            type="button"
            onClick={handleScrapeUrl}
            disabled={scraping || !form.productUrl.trim()}
            className="px-5 py-3 brand-gradient text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {scraping ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin">⟳</span> Analyzing...
              </span>
            ) : (
              "✨ Auto-Fill"
            )}
          </button>
        </div>
        {scrapeMsg && (
          <p className="text-sm mt-2">{scrapeMsg}</p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted">or fill in manually</span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Program / Service Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={form.serviceName}
            onChange={(e) => updateField("serviceName", e.target.value)}
            placeholder="e.g. FitLife Personal Training"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe what you offer, key benefits, what makes you unique..."
            className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Pricing
          </label>
          <input
            type="text"
            value={form.prices}
            onChange={(e) => updateField("prices", e.target.value)}
            placeholder="e.g. $49/month, Free trial, Starting at $99"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Contact Info
            </label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => updateField("contactInfo", e.target.value)}
              placeholder="Email, phone, or address"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Sign-up / Website URL
            </label>
            <input
              type="url"
              value={form.signupUrl}
              onChange={(e) => updateField("signupUrl", e.target.value)}
              placeholder="https://yoursite.com/signup"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-[#110d1d] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">
            Ad Image
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition"
          >
            {imagePreview ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain"
                />
                <span className="text-sm text-muted">Click to change image</span>
              </div>
            ) : (
              <div className="text-muted">
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm">
                  Click to upload an image for your ad (PNG, JPG — max 5MB)
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className={`w-full py-3.5 rounded-xl font-semibold text-white text-lg transition-all
          ${isValid ? "bg-primary hover:bg-primary-hover shadow-lg hover:shadow-xl" : "bg-muted cursor-not-allowed"}`}
      >
        Find Viral Trends →
      </button>
    </form>
  );
}
