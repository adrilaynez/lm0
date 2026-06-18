import withBundleAnalyzer from '@next/bundle-analyzer';
import createMDX from '@next/mdx';
import createNextIntlPlugin from 'next-intl/plugin';

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const analyzeBundles = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

/* next-intl: URL-based locale routing. Explicit request-config path = Turbopack-safe. */
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/* MDX for lab-chapter narrative content (src/content/lab/*.mdx). Plugins are declared
   as string names — required so the config stays serializable under Turbopack (Next 16 dev). */
const withMDX = createMDX({
    options: {
        remarkPlugins: [['remark-math']],
        rehypePlugins: [['rehype-katex']],
    },
});

const nextConfig = {
    reactStrictMode: true,
    // Tree-shake large barrel imports (icons + animation) so only the used symbols ship.
    // Safe, no behavior change — Next rewrites the imports to their deep paths at build time.
    experimental: {
        optimizePackageImports: ['lucide-react', 'framer-motion'],
    },
    // Allow an alternate build dir (e.g. to verify a production build while `next dev`
    // holds the default .next lock). Unset in normal use → defaults to .next.
    ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
    // Allow .md/.mdx alongside the usual extensions (does not turn content files into routes —
    // routes still come only from app/, which has no .mdx files).
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
    async headers() {
        // Content-Security-Policy is REPORT-ONLY: it never blocks anything, it only surfaces
        // violations (in the browser console / a report endpoint). Safe to ship; once the report
        // is clean, swap the header name to `Content-Security-Policy` to start enforcing.
        const csp = [
            "default-src 'self'",
            // Next.js injects inline bootstrap scripts; Vercel analytics loads from va.vercel-scripts.com.
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            // Same-origin + the backend (proxied via /api rewrite) + Vercel insights + dev backend.
            "connect-src 'self' https://lm-lab.onrender.com https://vitals.vercel-insights.com https://va.vercel-scripts.com http://localhost:8000",
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ].join('; ');

        const securityHeaders = [
            { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            { key: 'X-DNS-Prefetch-Control', value: 'on' },
            { key: 'Content-Security-Policy-Report-Only', value: csp },
        ];

        return [{ source: '/(.*)', headers: securityHeaders }];
    },
    async rewrites() {
        return [
            {
                source: '/api/v1/:path*',
                destination: isProd
                    ? 'https://lm-lab.onrender.com/api/v1/:path*'
                    : 'http://localhost:8000/api/v1/:path*',
            },
        ];
    },
};

export default withNextIntl(analyzeBundles(withMDX(nextConfig)));
