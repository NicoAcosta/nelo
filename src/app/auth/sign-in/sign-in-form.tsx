"use client";

import { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/use-locale";
import { NeloLogo } from "@/components/icons";

type Step = "email" | "otp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInForm() {
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<Step>("email");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function classifyError(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes("rate") || msg.includes("too many")) {
      return t("auth.rateLimited");
    }
    if (msg.includes("expired") || msg.includes("invalid") || msg.includes("otp")) {
      return t("auth.expiredOtp");
    }
    return t("auth.networkError");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !EMAIL_REGEX.test(email)) {
      setError(t("auth.invalidEmail"));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
        },
      });
      if (signInError) {
        setError(classifyError(signInError.message));
      } else {
        setStep("otp");
      }
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpComplete(token: string) {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (verifyError) {
        setError(classifyError(verifyError.message));
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const raw = searchParams.get("next") ?? "/projects";
        const safeDest = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/projects";
        router.push(safeDest);
      }
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    // Accept only a single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (digit && next.every((d) => d !== "")) {
      handleOtpComplete(next.join(""));
    }
  }

  function handleDigitKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handleDigitPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setOtp(next);
      inputRefs.current[5]?.focus();
      handleOtpComplete(pasted);
    }
  }

  async function handleResend() {
    setError(null);
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
        },
      });
      if (resendError) {
        setError(classifyError(resendError.message));
      }
    } catch {
      setError(t("auth.networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg p-8 flex flex-col gap-6">
        <div className="flex justify-center">
          <NeloLogo size="lg" />
        </div>
        <h1 className="text-2xl font-black font-headline text-on-surface text-center">
          {t("auth.signIn")}
        </h1>
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-on-surface/70"
            >
              {t("auth.emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-on-surface/20 bg-background text-on-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-black font-bold py-3 text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "..." : t("auth.continue")}
          </button>
        </form>
      </div>
    );
  }

  // OTP step
  return (
    <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg p-8 flex flex-col gap-6">
      <div className="flex justify-center">
        <NeloLogo size="lg" />
      </div>
      <div className="flex flex-col gap-2 text-center">
        <h2 className="text-xl font-black font-headline text-on-surface">
          {t("auth.otpLabel")}
        </h2>
        <p className="text-sm text-on-surface/60">{t("auth.checkEmail")}</p>
        <p className="text-xs text-on-surface/40 font-medium">{email}</p>
      </div>
      <div className="flex gap-2 justify-center">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            pattern="[0-9]"
            value={digit}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleDigitKeyDown(i, e)}
            onPaste={handleDigitPaste}
            disabled={loading}
            className="w-11 h-12 rounded-lg border border-on-surface/20 bg-background text-on-surface text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500 text-center" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className="text-sm text-on-surface/50 hover:text-on-surface underline underline-offset-2 transition-colors disabled:opacity-50 mx-auto"
      >
        {t("auth.resend")}
      </button>
    </div>
  );
}
