import { IconNelo } from "@/components/icons";

export default function ChatLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <IconNelo className="w-10 h-10 text-on-surface animate-pulse" />
    </div>
  );
}
