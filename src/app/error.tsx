"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface uppercase mb-4">
          Something went wrong
        </h1>
        <p className="text-on-surface/60 mb-8 text-sm">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-full hover:brightness-95 transition-all active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
