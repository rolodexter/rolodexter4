import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import Layout from '../projects/rolodexter4/ui/components/Layout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;