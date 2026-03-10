import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Content-Security-Policy directives
// Next.js requires 'unsafe-inline' for scripts (hydration) and styles (CSS-in-JS).
// Nonce-based CSP is possible but requires custom server config.
const cspDirectives = [
  "default-src 'self'",
  // Scripts: self + Google Analytics + unsafe-inline/eval (Next.js hydration)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://vercel.live https://static.cloudflareinsights.com https://js.tosspayments.com",
  // Styles: self + trusted font stylesheet CDNs + unsafe-inline (Next.js CSS)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://hangeul.pstatic.net https://spoqa.github.io https://cdn.jsdelivr.net",
  // Images: self + data/blob (PDF) + Google/Firebase storage + OAuth avatars
  "img-src 'self' data: blob: https://lh3.googleusercontent.com https://storage.googleapis.com https://firebasestorage.googleapis.com",
  // Fonts: self + trusted font CDNs used by template/font loader
  "font-src 'self' https://fonts.gstatic.com https://fastly.jsdelivr.net https://cdn.jsdelivr.net https://hangeul.pstatic.net https://spoqa.github.io data:",
  // Connect: self + analytics + Toss SDK endpoints (sandbox/prod + logging)
  "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://*.tosspayments.com https://tosspayments.com https://*.toss.im https://toss.im",
  // Workers: self + blob (html2canvas, ONNX background removal)
  "worker-src 'self' blob:",
  // Frame: allow Toss hosted payment windows/widgets when needed
  "frame-src 'self' https://*.tosspayments.com https://*.toss.im",
  // Object: none
  "object-src 'none'",
  // Base: self
  "base-uri 'self'",
  // Form: self
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: ["@gyoanmaker/shared"],
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "example.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "d3e2f31725ac",
  project: "gyoanmaker-web",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
});
