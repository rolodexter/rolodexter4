import type { AppProps } from 'next/app'
import { useState } from 'react'
import BackgroundAnimation from '../components/BackgroundAnimation'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  const [debugMode, setDebugMode] = useState(false)

  // Enable debug mode with Ctrl+Shift+D
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode(!debugMode)
      }
    })
  }

  return (
    <div className={`app-container ${debugMode ? 'debug-mode' : ''}`}>
      <BackgroundAnimation />
      <Component {...pageProps} />
    </div>
  )
}

export default MyApp