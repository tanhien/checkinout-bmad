import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  transpilePackages: ["@hotel/ui", "@hotel/types"],
  experimental: {
    typedRoutes: true,
  },
}

export default withNextIntl(nextConfig)
