"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  listEstimatesAction,
  getEstimateAction,
  updateEstimateLabelAction,
  getConversationIdAction,
} from "@/lib/actions/estimates";
import { compareEstimates } from "@/lib/estimate/compare";
import type { EstimateSummary, EstimateRow } from "@/lib/db/estimates";
import type { Estimate } from "@/lib/estimate/types";
import { useLocale } from "@/lib/i18n/use-locale";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import { formatARS } from "@/components/estimate/format";

function formatRelativeTime(dateStr: string, locale: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return locale === "es" ? "Hoy" : "Today";
  if (diffDays === 1) return locale === "es" ? "Ayer" : "Yesterday";
  if (diffDays < 7) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-diffDays, "day");
  }
  if (diffDays < 30) {
    const weeks = Math.round(diffDays / 7);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-weeks, "week");
  }
  return new Date(dateStr).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Version row with inline label editing
// ---------------------------------------------------------------------------

interface VersionRowProps {
  version: EstimateSummary;
  checked: boolean;
  onCheckChange: (id: string, checked: boolean) => void;
  locale: string;
  t: (key: string) => string;
}

function VersionRow({
  version,
  checked,
  onCheckChange,
  locale,
  t,
}: VersionRowProps) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState(version.label ?? "");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticLabel, updateOptimisticLabel] = useOptimistic(
    version.label,
    (_state: string | null, next: string) => next,
  );

  function handleLabelClick() {
    setEditing(true);
    setInputValue(version.label ?? "");
    setError(null);
  }

  function handleBlur() {
    setEditing(false);
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === version.label) {
      setInputValue(version.label ?? "");
      return;
    }
    const prev = version.label;
    updateOptimisticLabel(trimmed);
    startTransition(async () => {
      const result = await updateEstimateLabelAction(version.id, trimmed);
      if (result.error) {
        setInputValue(prev ?? "");
        setError(t("versionHistory.labelSaveFailed"));
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setInputValue(version.label ?? "");
      setEditing(false);
    }
  }

  const displayLabel = editing
    ? inputValue
    : (optimisticLabel ?? null);

  return (
    <li className="flex items-center gap-3 p-4 rounded-xl border border-outline/10 bg-surface hover:bg-surface-container transition-colors duration-150">
      {/* Checkbox — min 44px touch target */}
      <label className="flex items-center justify-center w-11 h-11 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckChange(version.id, e.target.checked)}
          className="w-5 h-5 accent-[#ccff00] cursor-pointer"
          aria-label={`Select version ${version.version} for comparison`}
        />
      </label>

      {/* Label + timestamp */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            maxLength={100}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full text-sm font-bold text-on-surface bg-transparent border-b border-primary outline-none"
            aria-label="Version label"
            placeholder={t("versionHistory.labelPlaceholder")}
          />
        ) : (
          <button
            type="button"
            onClick={handleLabelClick}
            className={`text-sm text-left w-full truncate ${
              displayLabel === null
                ? "text-on-surface/50 italic font-normal"
                : "font-medium text-on-surface hover:text-primary transition-colors"
            }`}
          >
            {displayLabel === null
              ? t("versionHistory.autoLabel").replace(
                  "{n}",
                  String(version.version),
                )
              : displayLabel}
          </button>
        )}
        {error && (
          <p className="text-[11px] text-error mt-0.5" role="alert">
            {error}
          </p>
        )}
        <time
          dateTime={version.created_at}
          className="block text-[11px] font-mono text-on-surface/40 mt-0.5"
        >
          {formatRelativeTime(version.created_at, locale)}
        </time>
      </div>

      {/* Total price */}
      <span className="font-mono font-bold text-sm text-on-surface shrink-0 tabular-nums">
        ${formatARS(version.total_price)}
        <span className="text-[10px] font-normal text-on-surface/40 ml-1">ARS</span>
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Comparison view
// ---------------------------------------------------------------------------

interface CompareViewProps {
  selectedIds: string[];
  versions: EstimateSummary[];
  onBack: () => void;
  t: (key: string) => string;
}

function CompareView({ selectedIds, versions, onBack, t }: CompareViewProps) {
  const [comparison, setComparison] = useState<ReturnType<
    typeof compareEstimates
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const vA = versions.find((v) => v.id === selectedIds[0]);
  const vB = versions.find((v) => v.id === selectedIds[1]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [rowA, rowB] = await Promise.all([
          getEstimateAction(selectedIds[0]),
          getEstimateAction(selectedIds[1]),
        ]);
        if (cancelled) return;
        if (
          !rowA || "error" in rowA ||
          !rowB || "error" in rowB
        ) {
          setLoadError(t("versionHistory.historyLoadFailed"));
          return;
        }
        const result = compareEstimates(
          (rowA as EstimateRow).result as Estimate,
          (rowB as EstimateRow).result as Estimate,
        );
        setComparison(result);
      } catch {
        if (!cancelled) setLoadError(t("versionHistory.historyLoadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [selectedIds, t]);

  const vANum = vA?.version ?? "?";
  const vBNum = vB?.version ?? "?";

  return (
    <div className="flex flex-col h-full">
      {/* Back header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[--color-outline-variant] shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-bold text-on-surface/60 hover:text-on-surface transition-colors flex items-center gap-1"
          aria-label={t("versionHistory.backToList")}
        >
          <span aria-hidden="true">&#8592;</span>
          {t("versionHistory.backToList")}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <p className="text-sm font-bold text-on-surface mb-4">
          {t("versionHistory.comparingHeader")
            .replace("{a}", String(vANum))
            .replace("{b}", String(vBNum))}
        </p>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-surface-container animate-pulse"
              />
            ))}
          </div>
        )}

        {loadError && (
          <p className="text-sm text-error">{loadError}</p>
        )}

        {comparison && !loading && (
          <>
            {/* Summary row */}
            <div className="bg-surface-container-high rounded-lg p-3 mb-4 grid grid-cols-3 gap-2">
              <SummaryCell
                label={t("versionHistory.totalChange")}
                value={comparison.totalPriceDelta}
                suffix="ARS"
                isPrice
              />
              <SummaryCell
                label={t("versionHistory.pricePerM2Change")}
                value={comparison.pricePerM2Delta}
                suffix="ARS"
                isPrice
              />
              <SummaryCell
                label={t("versionHistory.percentChange")}
                value={comparison.totalPricePercentDelta}
                suffix="%"
                isPrice={false}
              />
            </div>

            {/* Comparison table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  {t("versionHistory.comparisonCaption").replace("{a}", String(vANum)).replace("{b}", String(vBNum))}
                </caption>
                <thead>
                  <tr className="bg-surface-container">
                    <th className="px-3 py-2 text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] w-[40%]">
                      {t("versionHistory.categoryHeader")}
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] text-right w-[20%]">
                      v{vANum}
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] text-right w-[20%]">
                      v{vBNum}
                    </th>
                    <th className="px-3 py-2 text-[10px] font-bold text-[#999] uppercase tracking-[0.2em] text-right w-[20%]">
                      {t("versionHistory.deltaHeader")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.categories.map((cat, i) => {
                    const isIncrease = cat.delta > 0;
                    const isSavings = cat.delta < 0;
                    const isZero = cat.delta === 0;
                    return (
                      <tr
                        key={cat.id}
                        className={i % 2 === 1 ? "bg-white/[0.02]" : ""}
                      >
                        <td className="px-3 py-2 text-sm text-on-surface truncate max-w-0">
                          <span className="block truncate" title={cat.name}>
                            {cat.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-on-surface/80">
                          ${formatARS(cat.versionA)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-sm tabular-nums text-on-surface/80">
                          ${formatARS(cat.versionB)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`font-mono font-bold text-sm tabular-nums ${
                              isIncrease
                                ? "text-red-500"
                                : isSavings
                                  ? "text-green-500"
                                  : "text-on-surface/40"
                            }`}
                          >
                            {isIncrease && (
                              <span className="sr-only">increase </span>
                            )}
                            {isSavings && (
                              <span className="sr-only">decrease </span>
                            )}
                            {!isZero && (isIncrease ? "+" : "-")}$
                            {formatARS(Math.abs(cat.delta))}
                          </span>
                          {!isZero && (
                            <span className="block text-[11px] text-on-surface/40 font-mono tabular-nums">
                              ({isIncrease ? "+" : "-"}
                              {Math.abs(cat.deltaPercent).toFixed(1)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  suffix,
  isPrice,
}: {
  label: string;
  value: number;
  suffix: string;
  isPrice: boolean;
}) {
  const isPos = value > 0;
  const isNeg = value < 0;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-wider leading-tight">
        {label}
      </span>
      <span
        className={`font-mono font-bold text-sm tabular-nums ${
          isPos ? "text-red-500" : isNeg ? "text-green-500" : "text-on-surface/60"
        }`}
      >
        {isPos ? "+" : isNeg ? "-" : ""}
        {isPrice ? `$${formatARS(Math.abs(value))}` : Math.abs(value).toFixed(1)}
        <span className="text-[10px] font-normal ml-0.5">{suffix}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main VersionHistorySheet
// ---------------------------------------------------------------------------

interface VersionHistorySheetProps {
  /** Project ID (UUID) — resolved to conversation ID lazily on sheet open */
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHEET_TITLE_ID = "version-history-sheet-title";

export function VersionHistorySheet({
  projectId,
  open,
  onOpenChange,
}: VersionHistorySheetProps) {
  const { locale, t } = useLocale();

  const [view, setView] = useState<"list" | "compare">("list");
  const [versions, setVersions] = useState<EstimateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Load versions when sheet opens — resolve projectId -> conversationId first
  useEffect(() => {
    if (!open) return;
    setView("list");
    setSelectedIds([]);
    setLoadError(null);
    setLoading(true);

    async function fetchVersions() {
      const conversationId = await getConversationIdAction(projectId);
      if (!conversationId) {
        setLoadError(t("versionHistory.historyLoadFailed"));
        return;
      }
      const result = await listEstimatesAction(conversationId);
      if ("error" in result) {
        setLoadError(t("versionHistory.historyLoadFailed"));
      } else {
        setVersions(result);
      }
    }

    fetchVersions()
      .catch(() => {
        setLoadError(t("versionHistory.historyLoadFailed"));
      })
      .finally(() => setLoading(false));
  }, [open, projectId, t]);

  function handleCheckChange(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        // Max 2 selections — replace oldest if already 2
        if (prev.length >= 2) return [prev[1], id];
        return [...prev, id];
      }
      return prev.filter((x) => x !== id);
    });
  }

  const canCompare = selectedIds.length === 2;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent titleId={SHEET_TITLE_ID}>
        {view === "compare" ? (
          <CompareView
            selectedIds={selectedIds}
            versions={versions}
            onBack={() => setView("list")}
            t={t}
          />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle id={SHEET_TITLE_ID}>
                {t("versionHistory.sheetTitle")}
              </SheetTitle>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close version history"
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface/60 hover:text-on-surface"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 4L4 12M4 4l8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </SheetHeader>

            <SheetBody>
              {loading && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl bg-surface-container animate-pulse"
                    />
                  ))}
                </div>
              )}

              {loadError && !loading && (
                <p className="text-sm text-error">{loadError}</p>
              )}

              {!loading && !loadError && versions.length > 0 && (
                <>
                  <ul className="space-y-2">
                    {versions.map((version) => (
                      <VersionRow
                        key={version.id}
                        version={version}
                        checked={selectedIds.includes(version.id)}
                        onCheckChange={handleCheckChange}
                        locale={locale}
                        t={t}
                      />
                    ))}
                  </ul>

                  {versions.length === 1 && (
                    <p className="text-[11px] text-on-surface/40 text-center mt-4">
                      {t("versionHistory.oneVersionNotice")}
                    </p>
                  )}
                </>
              )}
            </SheetBody>

            <SheetFooter>
              <button
                type="button"
                onClick={() => setView("compare")}
                disabled={!canCompare}
                aria-disabled={!canCompare}
                title={
                  canCompare ? undefined : "Select 2 versions to compare"
                }
                className={`w-full bg-primary text-on-primary font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all ${
                  canCompare
                    ? "hover:brightness-95 active:scale-95 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                }`}
              >
                {t("versionHistory.compareVersions")}
              </button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
