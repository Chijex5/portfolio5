import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.247", "192.168.155.58"],
  // The dev badge sits on top of the HUD's chapter label.
  devIndicators: false,
};

export default nextConfig;
