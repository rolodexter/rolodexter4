import type { AppProps } from 'next/app'
import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { BackgroundAnimation } from '@components/common/BackgroundAnimation'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class">
      <BackgroundAnimation />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}

export default MyApp