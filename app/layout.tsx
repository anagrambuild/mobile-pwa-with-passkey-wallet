import { ClerkProvider } from '@clerk/nextjs'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import '../globals.css'

const APP_NAME = 'PWA Wallet'
const APP_DESCRIPTION = 'PWA Wallet Demo'

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: '%s - PWA App',
  },
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  themeColor: '#FFFFFF',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: '/favicon.ico',
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '192x192' }],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" dir="ltr">
        <head>
          <style>{`
            html, body, #__next {
              height: 100%;
            }
            #__next {
              margin: 0 auto;
            }
            h1 {
              text-align: center;
            }
            `}</style>
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
