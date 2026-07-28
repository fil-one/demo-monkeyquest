import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained Node.js server for the Ubuntu/systemd deployment.
  // The existing Sites build continues to use the same application source.
  output: "standalone",
};

export default nextConfig;
