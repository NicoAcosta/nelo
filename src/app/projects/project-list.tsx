"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { updateProjectTitle } from "@/lib/actions/projects";
import type { ProjectSummary } from "@/lib/db/conversations";
import { useLocale } from "@/lib/i18n/use-locale";
import { IconEstimates } from "@/components/icons";

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

interface ProjectRowProps {
  project: ProjectSummary;
  onRename: (id: string, title: string) => void;
  locale: string;
  t: (key: string) => string;
  index: number;
}

function ProjectRow({ project, onRename, locale, t, index }: ProjectRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(project.title);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleBlur() {
    setEditing(false);
    const trimmed = value.trim();
    if (!trimmed || trimmed === project.title) {
      setValue(project.title);
      return;
    }
    const originalTitle = project.title;
    onRename(project.id, trimmed);
    startTransition(async () => {
      const result = await updateProjectTitle(project.id, trimmed);
      if (result.error) {
        setValue(originalTitle);
        setError(result.error);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") e.currentTarget.blur();
    if (e.key === "Escape") {
      setValue(project.title);
      setEditing(false);
    }
  }

  return (
    <li
      className="flex items-center justify-between p-4 rounded-xl border border-outline/10 bg-surface hover:bg-surface-container transition-colors duration-150 animate-message-in"
      style={{ animationDelay: `${Math.min(index, 5) * 50}ms` }}
    >
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            maxLength={100}
            className="w-full text-sm font-medium text-on-surface bg-transparent border-b border-primary outline-none focus:ring-2 focus:ring-primary"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-label="Project title"
          />
        ) : (
          <button
            onClick={() => {
              setEditing(true);
              setError(null);
            }}
            className="text-sm font-medium text-on-surface truncate text-left w-full hover:text-primary transition-colors"
            title={t("projects.renameHint")}
          >
            {project.title}
          </button>
        )}
        {error && (
          <p className="text-[11px] text-error mt-0.5" role="alert">
            {error}
          </p>
        )}
        <time
          dateTime={project.updated_at}
          className="block text-[11px] font-medium font-mono text-on-surface/40 mt-1"
        >
          {formatRelativeTime(project.updated_at, locale)}
        </time>
      </div>
      <Link
        href={"/chat/" + project.id}
        className="ml-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider border border-primary/30 rounded-full text-primary hover:bg-primary hover:text-on-primary transition-all active:scale-95 shrink-0"
        aria-label={"Open " + project.title}
      >
        <span className="hidden md:inline">{t("projects.open")}</span>
        <span className="md:hidden">&rarr;</span>
      </Link>
    </li>
  );
}

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  const { t, locale } = useLocale();
  const [optimisticProjects, updateOptimistic] = useOptimistic(
    projects,
    (
      state,
      { id, title }: { id: string; title: string },
    ) => state.map((p) => (p.id === id ? { ...p, title } : p)),
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-on-surface mb-8">
        {t("projects.title")}
      </h1>

      {optimisticProjects.length === 0 ? (
        <div className="text-center py-20">
          <IconEstimates className="w-10 h-10 text-on-surface/20 mx-auto mb-4" />
          <p className="text-sm font-medium text-on-surface/40 mb-1">
            {t("projects.empty")}
          </p>
          <p className="text-sm text-on-surface/30 mb-6">
            {t("projects.emptyBody")}
          </p>
          <Link
            href="/chat"
            className="inline-block px-5 py-3 bg-primary text-on-primary font-bold text-xs uppercase tracking-wider rounded-full hover:brightness-95 transition-all active:scale-95"
          >
            {t("projects.startFirst")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {optimisticProjects.map((project, index) => (
            <ProjectRow
              key={project.id}
              project={project}
              onRename={(id, title) => updateOptimistic({ id, title })}
              locale={locale}
              t={t}
              index={index}
            />
          ))}
        </ul>
      )}
    </>
  );
}
