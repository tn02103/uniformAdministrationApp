import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3021';
    return {
        rules: [
            {
                userAgent: '*',
                // Only the public documentation section should be indexed.
                // Authenticated app routes (/:locale/:acronym/*) must not be crawled.
                allow: [/*'/en/docs',*/ '/de/docs'], // english docs are currently not available, so we only allow german docs for now
                disallow: ['/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
