import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@resvg/resvg-js",
    "@napi-rs/canvas",
    "@mlightcad/libredwg-converter",
    "@mlightcad/data-model",
    "@mlightcad/libredwg-web",
    "@mlightcad/common",
    "@mlightcad/geometry-engine",
    "@mlightcad/graphic-interface",
    "@mlightcad/dxf-json",
    "pdfjs-dist",
  ],
};

export default nextConfig;
