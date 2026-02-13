import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { TranscriptionProvider } from '../context/TranscriptionContext'
import { SellerProvider } from '../context/SellerContext'
import { SupabaseProvider } from '../hooks/useSupabase'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <SupabaseProvider>
            <SellerProvider>
                <TranscriptionProvider>
                    <Component {...pageProps} />
                </TranscriptionProvider>
            </SellerProvider>
        </SupabaseProvider>
    )
}
