import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["bun:sqlite"],
  outputFileTracingRoot: path.join(__dirname)
};

export default nextConfig;
