"use client";

import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  createShareLinkAction,
  deleteShareLinkAction,
  getShareLinkForEstimateAction,
} from "@/lib/actions/share-links";
import type { ShareLinkRow } from "@/lib/db/share-links";

interface SharePopoverProps {
  estimateId: string;
}

type ExpirationValue = number | null;

const EXPIRATION_OPTIONS: Array<{ label: string; value: ExpirationValue }> = [
  { label: "noExpiration", value: null },
  { label: "7days", value: 7 },
  { label: "30days", value: 30 },
  { label: "90days", value: 90 },
];

export function SharePopover({ estimateId }: SharePopoverProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [existingLink, setExistingLink] = useState<ShareLinkRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<ExpirationValue>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      // Fetch existing link on open
      setLoading(true);
      setError(null);
      setConfirmRevoke(false);
      try {
        const result = await getShareLinkForEstimateAction(estimateId);
        if (result && "error" in result) {
          setError(result.error);
          setExistingLink(null);
        } else {
          setExistingLink(result);
        }
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleCreateLink() {
    setLoading(true);
    setError(null);
    try {
      const result = await createShareLinkAction(estimateId, expiresInDays);
      if ("error" in result) {
        setError(result.error);
      } else {
        setExistingLink(result);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!existingLink) return;
    const url = `${window.location.origin}/share/${existingLink.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevokeConfirm() {
    if (!existingLink) return;
    setLoading(true);
    try {
      await deleteShareLinkAction(existingLink.id);
      setExistingLink(null);
      setConfirmRevoke(false);
      setExpiresInDays(null);
    } finally {
      setLoading(false);
    }
  }

  const shareUrl = existingLink
    ? (typeof window !== "undefined" ? window.location.origin : "") +
      `/share/${existingLink.token}`
    : null;

  const expiryLabel = existingLink?.expires_at
    ? t("share.expiresOn").replace(
        "{date}",
        new Date(existingLink.expires_at).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      )
    : t("share.noExpiry");

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger>
        <button
          type="button"
          aria-label="Share"
          className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-white/[0.06] text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#ccff00]"
        >
          {`↗ ${t("estimate.share")}`}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-[320px] bg-[#18181b] border-white/[0.08] text-sm"
      >
        {loading && !existingLink ? (
          <div className="text-[#71717a] text-xs py-2">Loading...</div>
        ) : existingLink ? (
          /* Existing link view */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a]">
                {t("share.linkCreated")}
              </span>
              <div className="flex items-center gap-2 bg-[#09090b] border border-white/[0.06] rounded-lg px-3 py-2">
                <span className="text-[11px] text-[#a1a1aa] font-mono truncate flex-1 select-all">
                  {shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy link"
                  className="shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold bg-[#18181b] border border-white/[0.06] text-[#a1a1aa] hover:text-white transition-colors focus-visible:ring-1 focus-visible:ring-[#ccff00]"
                >
                  {copied ? t("share.copied") : t("share.copyLink")}
                </button>
              </div>
              <span className="text-[11px] text-[#52525b]">{expiryLabel}</span>
            </div>

            {confirmRevoke ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-[#a1a1aa]">
                  {t("share.revokeConfirm")}
                </span>
                <button
                  type="button"
                  onClick={handleRevokeConfirm}
                  disabled={loading}
                  className="text-[11px] font-semibold text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  Yes, revoke
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRevoke(false)}
                  className="text-[11px] text-[#71717a] hover:text-[#a1a1aa] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRevoke(true)}
                className="self-start text-[11px] text-red-500/70 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:underline"
              >
                {t("share.revokeLink")}
              </button>
            )}
          </div>
        ) : (
          /* Create link view */
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="expiration-select"
                className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a]"
              >
                {t("share.expiration")}
              </label>
              <select
                id="expiration-select"
                value={expiresInDays === null ? "null" : String(expiresInDays)}
                onChange={(e) => {
                  const val = e.target.value;
                  setExpiresInDays(val === "null" ? null : Number(val));
                }}
                className="w-full bg-[#09090b] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-[#a1a1aa] focus:outline-none focus:ring-1 focus:ring-[#ccff00] appearance-none cursor-pointer"
              >
                {EXPIRATION_OPTIONS.map((opt) => (
                  <option
                    key={String(opt.value)}
                    value={opt.value === null ? "null" : String(opt.value)}
                  >
                    {t(`share.${opt.label}` as Parameters<typeof t>[0])}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-[11px] text-red-400">{t("share.error")}</p>
            )}

            <button
              type="button"
              onClick={handleCreateLink}
              disabled={loading}
              className="w-full px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#ccff00] text-black hover:bg-[#E2FF00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#ccff00]"
            >
              {loading ? "Creating..." : t("share.createLink")}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
