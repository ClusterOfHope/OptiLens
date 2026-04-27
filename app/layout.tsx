import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OptiLens — Find the ads burning your money',
  description:
    'OptiLens scans your Meta ad account daily and surfaces every campaign wasting spend. Free during beta for the first 50 brands.',
  openGraph: {
    title: 'OptiLens — Find the ads burning your money',
    description: 'Daily ad waste detection for Meta-spending brands. Free during beta.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..600;1,9..144,400..500&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
