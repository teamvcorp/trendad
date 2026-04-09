"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-secondary animate-pulse" />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 rounded-xl brand-gradient text-white text-sm font-semibold hover:opacity-90 transition"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary hover:bg-border transition text-sm font-medium"
      >
        <span className="w-7 h-7 rounded-full brand-gradient text-white flex items-center justify-center text-xs font-bold">
          {(session.user?.name || session.user?.email || "U")[0].toUpperCase()}
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate">
          {session.user?.name || session.user?.email}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1e1535] border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold truncate">{session.user?.name}</p>
              <p className="text-xs text-muted truncate">{session.user?.email}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm hover:bg-secondary transition"
            >
              ⚙️ Profile &amp; Tokens
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-secondary transition"
            >
              🚪 Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
