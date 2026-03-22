"use client";

import { useEffect } from "react";
import { NeloLogo } from "@/components/icons";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg p-8 flex flex-col gap-6 items-center">
        <NeloLogo size="lg" />
        <h1 className="text-xl font-black font-headline text-on-surface text-center">
          Authentication Error
        </h1>
        <p className="text-sm text-on-surface/60 text-center">
          Something went wrong during sign in. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg bg-primary text-black font-bold py-3 text-sm hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
