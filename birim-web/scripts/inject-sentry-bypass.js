const fs = require('fs')
const path = require('path')

const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html')

if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8')

    const proxyScript = `
<script>
// Monkey-patch to silently swallow Sentry ingest errors caused by Adblockers in Sanity Studio
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    try {
      return await originalFetch.apply(this, args);
    } catch (error) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
      if (url.includes('sentry.io') || url.includes('ingest.us.sentry.io')) {
        return new Response(null, { status: 200 });
      }
      throw error;
    }
  };

  const originalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = class extends originalXHR {
    open(method, url, ...rest) {
      this._sentryUrl = String(url);
      super.open(method, url, ...rest);
    }
    send(body) {
      try {
        super.send(body);
      } catch (error) {
        const sentryUrl = this._sentryUrl;
        if (sentryUrl && (sentryUrl.includes('sentry.io') || sentryUrl.includes('ingest.us.sentry.io'))) {
          console.warn('Caught XHR send error to Sentry:', error);
          return;
        }
        throw error;
      }
    }
  };
}
</script>
`

    // Inject right after <head>
    if (!html.includes('Monkey-patch to silently swallow Sentry')) {
        html = html.replace('<head>', '<head>' + proxyScript)
        fs.writeFileSync(indexHtmlPath, html, 'utf8')
        console.log('Successfully injected Sentry Adblocker bypass into index.html')
    } else {
        console.log('Sentry bypass already injected.')
    }
} else {
    console.log('dist/index.html not found, skipping Sentry bypass injection.')
}
