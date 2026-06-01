import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@hotel/ui", "@hotel/types"],
  typedRoutes: true,
}

export default nextConfig
