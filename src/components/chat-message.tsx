import ReactMarkdown from "react-markdown";
import { IconNelo } from "./icons";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex gap-6 max-w-3xl ml-auto flex-row-reverse animate-message-in">
        <div
          data-testid="user-avatar"
          className="w-10 h-10 rounded-full bg-black flex items-center justify-center flex-shrink-0 shadow-lg"
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" />
            <path d="M20 21a8 8 0 0 0-16 0" />
          </svg>
        </div>
        <div className="flex flex-col items-end">
          <div className="glass-primary text-black rounded-2xl p-6 shadow-md border border-white/20">
            <p className="text-lg font-bold font-headline break-words overflow-wrap-anywhere">{content}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 max-w-3xl animate-message-in">
      <div
        data-testid="assistant-avatar"
        className="w-10 h-10 rounded-lg bg-outline/30 flex items-center justify-center flex-shrink-0"
      >
        <IconNelo className="w-5 h-5 text-on-surface" />
      </div>
      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-6 border border-white/40 shadow-sm">
          <div className="text-on-surface text-lg leading-relaxed font-medium break-words overflow-wrap-anywhere [&_strong]:font-bold [&_em]:italic [&_p]:my-3 first:[&_p]:mt-0 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-base">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
