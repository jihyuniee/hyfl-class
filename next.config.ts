import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return ["/admissions/seoul", "/admissions/susi", "/admissions/china"].map(source => ({
      source,
      destination: "/admissions",
      permanent: false,
    }));
  },
};

export default nextConfig;
