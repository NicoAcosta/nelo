import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "@napi-rs/canvas", "@mlightcad/libredwg-converter"],
};

export default nextConfig;
