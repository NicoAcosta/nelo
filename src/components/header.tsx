import Link from "next/link";
import { IconPlus } from "./icons";

export function Header({ projectName }: { projectName?: string }) {
  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-outline/10 sticky top-0 z-50 flex justify-between items-center w-full px-6 py-4">
      <div className="flex items-center gap-4">
        <span className="text-xl font-black text-on-surface tracking-tighter font-headline uppercase">
          Nelo
        </span>
        {projectName && (
          <>
            <div className="h-5 w-px bg-outline/30 mx-1 hidden md:block" />
            <span className="hidden md:inline text-on-surface/50 font-medium text-sm">
              {projectName}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <span className="hidden md:block text-[10px] text-on-surface/40 font-bold uppercase tracking-widest">
          Updated: Oct 24
        </span>
        <Link
          href="/chat"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-full shadow-sm hover:brightness-95 transition-all active:scale-95"
        >
          <IconPlus />
          New Estimate
        </Link>
      </div>
    </header>
  );
}
