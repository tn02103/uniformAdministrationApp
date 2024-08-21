import ModalProvider from '@/components/modals/modalProvider';
import { I18nProviderClient } from '@/lib/locales/client';
import { getStaticParams } from '@/lib/locales/config';
import '@fortawesome/fontawesome-svg-core/styles.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'react-tooltip/dist/react-tooltip.css';
import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import './../../styles/global.scss';
import './../../styles/globals.css';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Uniformverwaltung',
    description: 'App zum Verwalen von Uniformteilen',
}


export function generateStaticParams() {
    return getStaticParams();
}

export default function RootLayout({
    children, params
}: {
    children: React.ReactNode,
    params: { locale: string }
}) {

    return (
        <html lang="en">
            <body>
                <I18nProviderClient locale={params.locale}>
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
