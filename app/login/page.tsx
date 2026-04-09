"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Registration failed");
          setLoading(false);
          return;
        }
        // Auto-login after registration
      }

      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/1024Logo.png" alt="TrendAd" className="h-14 mx-auto mb-3" />
          <p className="text-muted mt-2">
            {mode === "login"
              ? "Sign in to save your campaigns and tokens"
              : "Create an account to get started"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#1e1535] rounded-2xl border border-border p-6 space-y-4"
        >
          {/* Toggle */}
          <div className="flex bg-secondary rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white dark:bg-[#110d1d] shadow text-foreground"
                  : "text-muted"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white dark:bg-[#110d1d] shadow text-foreground"
                  : "text-muted"
              }`}
            >
              Register
            </button>
          </div>

          {mode === "register" && (
            <div>
              <label className="text-xs text-muted block mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder={mode === "register" ? "At least 6 characters" : "••••••••"}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl brand-gradient text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>

          <p className="text-center text-xs text-muted">
            {mode === "login" ? (
              <>Your tokens and business info are saved securely to your account.</>
            ) : (
              <>After registering, your Facebook/YouTube tokens and business info will persist across sessions.</>
            )}
          </p>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          <a href="/" className="underline hover:text-foreground">
            Continue without account →
          </a>
        </p>
      </div>
    </div>
  );
}
