import type { AppProps } from 'next/app'
import Layout from './layout/Layout'
import '@/styles/globals.css'
import { useEffect } from 'react'

function MyApp({ Component, pageProps }: AppProps) {
  // Handle initial dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp