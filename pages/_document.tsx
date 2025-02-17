import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          
          {/* Primary Meta Tags */}
          <meta name="description" content="rolodexter4 - Intelligent Agent System" />
          <meta name="theme-color" content="#FF2C2C" />
          
          {/* Favicon Tags */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          
          {/* Apple Touch Icon */}
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          
          {/* Android Icons */}
          <link rel="manifest" href="/site.webmanifest" />
          
          {/* Safari Pinned Tab */}
          <meta name="apple-mobile-web-app-title" content="rolodexter4" />
          <meta name="application-name" content="rolodexter4" />
          <meta name="msapplication-TileColor" content="#FF2C2C" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;