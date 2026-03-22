import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nelo — AI Construction Cost Estimator",
  description:
    "Estimate your construction costs in seconds with AI. Detailed budgets based on real AMBA pricing and advanced analytics.",
  openGraph: {
    title: "Nelo — AI Construction Cost Estimator",
    description:
      "Estimate your construction costs in seconds with AI. Detailed budgets based on real AMBA pricing.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nelo — AI Construction Cost Estimator",
    description:
      "Estimate your construction costs in seconds with AI. Detailed budgets based on real AMBA pricing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-full flex">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
