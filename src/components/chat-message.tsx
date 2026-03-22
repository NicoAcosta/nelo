import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconNelo } from "./icons";
import { splitPreambleFromDisplay } from "@/lib/documents/split-preamble";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  if (role === "user") {
    const { displayText, hasPreamble, files } =
      splitPreambleFromDisplay(content);

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
        <div className="flex flex-col items-end gap-2">
          <div className="glass-primary text-black rounded-2xl p-6 shadow-md border border-white/20">
            <p className="text-lg font-bold font-headline break-words overflow-wrap-anywhere">
              {displayText}
            </p>
            {hasPreamble && files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-black/10">
                {files.map((file, i) => (
                  <span
                    key={`${file.name}-${i}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-black/70 bg-black/10 px-2.5 py-1 rounded-lg"
                  >
                    <svg
                      aria-hidden="true"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span className="truncate max-w-[180px]">{file.name}</span>
                    <span className="text-black/40">·</span>
                    <span className="text-black/50">{file.type}</span>
                  </span>
                ))}
              </div>
            )}
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
          <div className="text-on-surface text-lg leading-relaxed font-medium break-words overflow-wrap-anywhere [&_strong]:font-bold [&_em]:italic [&_p]:my-3 first:[&_p]:mt-0 last:[&_p]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-base [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:text-base [&_h4]:font-bold [&_h4]:mt-4 [&_h4]:mb-2 [&_hr]:border-on-surface/20 [&_hr]:my-4 [&_table]:w-full [&_table]:my-4 [&_table]:border-collapse [&_table]:text-base [&_th]:text-left [&_th]:font-bold [&_th]:px-3 [&_th]:py-2 [&_th]:border-b [&_th]:border-on-surface/20 [&_td]:px-3 [&_td]:py-2 [&_td]:border-b [&_td]:border-on-surface/10">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
