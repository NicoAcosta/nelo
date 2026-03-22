"use client";

import { LocaleProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </AuthProvider>
  );
}
