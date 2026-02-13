import { LVMHSlider } from '@/components/LVMHSlider'
import ExecutiveImpactCarousel from '@/components/ui/executive-impact-carousel'
import { LandingContent } from '@/components/LandingContent'
import Head from 'next/head'

export default function Landing() {
    return (
        <main>
            <Head>
                <title>LVMH - Executive Excellence Console</title>
                <meta name="description" content="LVMH Luxury Console - Excellence in Design and Intelligence." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <LVMHSlider />
            <ExecutiveImpactCarousel />
            <LandingContent />
        </main>
    )
}
