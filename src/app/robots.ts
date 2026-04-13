import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3021';
    return {
        rules: [
            {
                userAgent: '*',
                // Only the public documentation section should be indexed.
                // Authenticated app routes (/:locale/:acronym/*) must not be crawled.
                allow: ['/en/docs', '/de/docs'],
                disallow: ['/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
