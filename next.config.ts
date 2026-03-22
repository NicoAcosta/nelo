import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "@napi-rs/canvas"],
};

export default nextConfig;
