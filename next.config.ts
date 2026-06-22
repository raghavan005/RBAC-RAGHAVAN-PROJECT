import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR WebSocket connections from LAN IPs (e.g. 192.168.x.x)
  // so the dev server works when accessed from other devices on the network.
  allowedDevOrigins: ["*"],

  // Empty turbopack config silences the webpack/turbopack mismatch warning.
  turbopack: {},

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent the app from being loaded inside a cross-origin frame
          // (fixes: "Unsafe attempt to load URL … from frame with URL chrome-error://…")
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
