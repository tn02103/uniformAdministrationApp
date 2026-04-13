import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Uniformverwaltung',
        short_name: 'Uniformadmin',
        description: 'Webanwendung zur Verwaltung von Uniformteilen, Material und Kontrollen.',
        start_url: '/login',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#01153e',
        icons: [
            {
                src: '/favicon.ico',
                sizes: '48x48',
                type: 'image/x-icon',
            },
        ],
    };
}
