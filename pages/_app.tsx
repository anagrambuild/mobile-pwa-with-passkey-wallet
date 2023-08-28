import { ClerkProvider } from '@clerk/nextjs'
import type { AppProps } from 'next/app'
import { App as AppProvider } from 'konsta/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Head from 'next/head'
import { useState, useEffect, useLayoutEffect } from 'react'
import '../globals.css'
import { WagmiConfig, configureChains, createConfig, mainnet } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'
import { base } from 'wagmi/chains'

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [base],
  [publicProvider()],
)

const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient,
})

const queryClient = new QueryClient()

const APP_NAME = 'PWA Wallet'
const APP_DESCRIPTION = 'PWA with an embedded passkey crypto wallet'

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState('ios')
  const [currentColorTheme, setCurrentColorTheme] = useState('')
  const setColorTheme = (color: any) => {
    const htmlEl = document.documentElement
    htmlEl.classList.forEach((c) => {
      if (c.includes('k-color')) htmlEl.classList.remove(c)
    })
    if (color) htmlEl.classList.add(color)
    setCurrentColorTheme(color)
  }
  useEffect(() => {
    ;(global as any).setTheme = (t: any) => setTheme(t)
    ;(global as any).setMode = (mode: any) => {
      document.documentElement.classList.remove('dark')
    }
  }, [])
  const inIFrame = global.parent !== global.window
  useLayoutEffect(() => {
    if (global.location.href.includes('safe-areas')) {
      const html = document.documentElement
      if (html) {
        html.style.setProperty(
          '--k-safe-area-top',
          theme === 'ios' ? '44px' : '24px',
        )
        html.style.setProperty('--k-safe-area-bottom', '34px')
      }
    }
  }, [theme])

  return (
    <>
      <AppProvider theme={theme as any} safeAreas={true}>
        <ClerkProvider {...pageProps}>
          <QueryClientProvider client={queryClient}>
            <WagmiConfig config={wagmiConfig}>
              <Head>
                <meta name="application-name" content={APP_NAME} />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-title" content={APP_NAME} />
                <meta name="description" content={APP_DESCRIPTION} />
                <meta name="format-detection" content="telephone=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta
                  name="apple-mobile-web-app-status-bar-style"
                  content="black-translucent"
                />
                <meta name="theme-color" content="#FFFFFF" />
                <meta
                  name="viewport"
                  content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover"
                />
                <link
                  rel="apple-touch-icon"
                  sizes="180x180"
                  href="/icons/apple-touch-icon.png"
                />
                <link rel="manifest" href="/manifest.json" />
                <link rel="shortcut icon" href="/favicon.ico" />
              </Head>
              <Component {...pageProps} />
            </WagmiConfig>
          </QueryClientProvider>
        </ClerkProvider>
      </AppProvider>
    </>
  )
}
