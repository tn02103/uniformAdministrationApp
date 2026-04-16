import { MetadataRoute } from 'next';

const locales = ['en', 'de'];

// All public documentation pages (relative to /[locale])
const docsPaths = [
    '/docs',
    '/docs/cadet',
    '/docs/cadet/list',
    '/docs/cadet/detail',
    '/docs/uniform',
    '/docs/uniform/list',
    '/docs/uniform/detail',
    '/docs/uniform/type',
    '/docs/uniform/sizes',
    '/docs/storage',
    '/docs/storage/overview',
    '/docs/material',
    '/docs/inspection',
    '/docs/inspection/conduct',
    '/docs/inspection/deficiencies',
    '/docs/dashboard',
    '/docs/admin/uniform',
    '/docs/admin/material',
    '/docs/admin/users',
    '/docs/admin/settings',
];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3020';

    return locales.flatMap((locale) =>
        docsPaths.map((path) => ({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: path === '/docs' ? 1.0 : 0.8,
        }))
    );
}
