import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';


function seoFiles(siteUrl) {
  return {
    name: 'seo-files',
    transformIndexHtml(html) {
      if (!siteUrl) return html;

      return {
        html: html
          .replace('<link rel="canonical" />', `<link rel="canonical" href="${siteUrl}/" />`)
          .replace('<meta property="og:url" content="/" />', `<meta property="og:url" content="${siteUrl}/" />`)
          .replace('<meta property="og:image" content="/logo.png" />', `<meta property="og:image" content="${siteUrl}/logo.png" />`),
        tags: [{
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'OnlineStore',
            name: 'Pooja Collection',
            url: `${siteUrl}/`,
            logo: `${siteUrl}/logo.png`,
            email: 'hello@poojacollection.in',
            description: 'Elegant jewellery for everyday wear and festive occasions.',
            currenciesAccepted: 'INR',
          }),
          injectTo: 'head',
        }],
      };
    },
    generateBundle(_, bundle) {
      if (!siteUrl) return;

      for (const fileName of ['robots.txt', 'sitemap.xml']) {
        const asset = bundle[fileName];
        if (asset?.type === 'asset') {
          asset.source = String(asset.source).replaceAll('https://poojascollection.com', siteUrl);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const { VITE_SITE_URL = '' } = loadEnv(mode, process.cwd(), 'VITE_');
  let siteUrl = VITE_SITE_URL || (mode === 'production' ? 'https://poojascollection.com' : '');

  if (siteUrl) {
    const parsedUrl = new URL(siteUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || parsedUrl.pathname !== '/' ||
      parsedUrl.search || parsedUrl.hash || parsedUrl.username || parsedUrl.password) {
      throw new Error('VITE_SITE_URL must be a public origin such as https://poojacollection.in');
    }
    siteUrl = parsedUrl.origin;
  }

  return {
    plugins: [react(), seoFiles(siteUrl)],
    envDir: './',
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: false,
    },
  };
});
