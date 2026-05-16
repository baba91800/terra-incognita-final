import type { Metadata } from 'next'
import { Space_Mono, Rajdhani } from 'next/font/google'
import './globals.css'
import 'leaflet/dist/leaflet.css'

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
})

const rajdhani = Rajdhani({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Terra Incognita',
  description: 'Explore the unknown. Map your world.',
  manifest: '/manifest.json',
  themeColor: '#00f5d4',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Terra Incognita',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${rajdhani.variable}`}>
      <body className="bg-[#030810] text-white overflow-hidden">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        {children}
      </body>
    </html>
  )
}
