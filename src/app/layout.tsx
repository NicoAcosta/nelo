import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nelo — AI Construction Cost Estimator",
  description:
    "Estimate your construction costs in seconds with AI. Detailed budgets based on real AMBA pricing and advanced analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex">{children}</body>
    </html>
  );
}
