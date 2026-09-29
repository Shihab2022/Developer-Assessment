/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `npm run lint` reports these; they are pre-existing repo-wide issues and are
  // kept out of `next build` so shipping is not blocked by the lint backlog.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Company logos and user avatars can point at any external host.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
};

export default nextConfig;