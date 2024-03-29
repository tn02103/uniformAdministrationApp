import ModalProvider from '@/components/modals/modalProvider';
import { I18nProviderClient } from '@/lib/locales/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './../../styles/global.scss';
import './../../styles/globals.css';
import { getStaticParams } from '@/lib/locales/config';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Create Next App',
    description: 'Generated by create next app',
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
