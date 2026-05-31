import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@hotel/ui", "@hotel/types"],
  experimental: {
    typedRoutes: true,
  },
}

export default nextConfig
