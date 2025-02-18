import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  // Removed any layout or additional triggers that might invoke task APIs.
  return <Component {...pageProps} />;
}