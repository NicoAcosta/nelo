import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-black font-headline tracking-tight text-on-surface uppercase mb-4">
          404
        </h1>
        <p className="text-on-surface/60 mb-8 text-sm">
          Page not found. The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 bg-primary text-on-primary font-bold text-sm uppercase tracking-wider rounded-full hover:brightness-95 transition-all active:scale-95"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
