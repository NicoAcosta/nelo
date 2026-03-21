"use client";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="text-3xl font-black font-headline tracking-tight text-on-surface uppercase mb-4">
          Chat Error
        </h1>
        <p className="text-on-surface/60 mb-8 text-sm">
          Something went wrong with the chat. Your conversation may have been interrupted.
        </p>
        <button
          type="button"
          onClick={reset}
          className="px-8 py-3 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-full hover:brightness-95 transition-all active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
