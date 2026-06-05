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
    reactStrictMode: false,
    // Allow an alternate build dir (e.g. to verify a production build while `next dev`
    // holds the default .next lock). Unset in normal use → defaults to .next.
    ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
    // Allow .md/.mdx alongside the usual extensions (does not turn content files into routes —
    // routes still come only from app/, which has no .mdx files).
    pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
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
    async redirects() {
        return [
            {
                source: '/notes',
                destination: '/latent-space?mode=essays',
                permanent: false,
            },
            {
                source: '/notes/:slug',
                destination: '/latent-space/essays/:slug',
                permanent: false,
            },
            {
                source: '/latent-space/garden/:slug',
                destination: '/latent-space/mind/:slug',
                permanent: true,
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },
};

export default withNextIntl(analyzeBundles(withMDX(nextConfig)));
