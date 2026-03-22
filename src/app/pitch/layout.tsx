import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nelo — AI Construction Cost Estimator | Pitch",
  description:
    "Nelo uses AI to deliver accurate, transparent construction cost estimates for the AMBA region through natural conversation.",
};

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
