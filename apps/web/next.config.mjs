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
  // Workspace packages (e.g. @topgun/ui) use NodeNext-style ESM imports
  // with explicit ".js" extensions even in .ts/.tsx sources. Teach
  // webpack to resolve those back to the TypeScript source files.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
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
