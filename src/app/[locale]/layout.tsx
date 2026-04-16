import ModalProvider from '@/components/modals/modalProvider';
import { I18nProviderClient } from '@/lib/locales/client';
import { getStaticParams } from '@/lib/locales/config';
import '@fortawesome/fontawesome-svg-core/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import type { Metadata, Viewport } from 'next';
import 'react-calendar/dist/Calendar.css';
import 'react-date-picker/dist/DatePicker.css';
import { ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-tooltip/dist/react-tooltip.css';
import './../../styles/global.scss';
import './../../styles/globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3020';

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        template: '%s — Uniformverwaltung',
        default: 'Uniformverwaltung',
    },
    description: 'Webanwendung zur Verwaltung von Uniformteilen, Material und Kontrollen für Non-Profit-Organisationen.',
    applicationName: 'Uniformadmin',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
    },
    openGraph: {
        siteName: 'Uniformverwaltung',
        type: 'website',
        locale: 'de_DE',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover', // This enables safe area support
    themeColor: '#01153e', // Navy color for status bar
}

export function generateStaticParams() {
    return getStaticParams();
}

export default async function RootLayout({
    children, params
}: {
    children: React.ReactNode,
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params;
    return (
        <html lang={locale}>
            <body>
                <I18nProviderClient locale={locale}>
                    <ModalProvider>
                        {children}
                    </ModalProvider>
                </I18nProviderClient>
                <ToastContainer
                    position='top-right'
                    autoClose={2500}
                    theme='light'
                    hideProgressBar={true}
                    transition={Zoom}
                />
            </body>
        </html>
    )
}
