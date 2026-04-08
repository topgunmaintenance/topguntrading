/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages are consumed from TypeScript source via the
  // `paths` entries in tsconfig.json. Next.js must transpile them.
  transpilePackages: [
    "@topgun/ui",
    "@topgun/types",
    "@topgun/config",
    "@topgun/charting",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
