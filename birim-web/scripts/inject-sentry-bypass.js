const fs = require('fs')
const path = require('path')

const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html')

if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8')

  const proxyScript = `
<script>
// Block ALL Sentry requests BEFORE they leave the browser.
// Sanity CDN loads sentry-*.js which saves its own fetch/XHR references at import time,
// so we must intercept at the lowest level BEFORE any module loads.
(function() {
  var BLOCK = ['sentry.io', 'ingest.us.sentry.io'];
  function isSentry(u) { var s = String(u||''); return BLOCK.some(function(d){return s.indexOf(d)!==-1}); }

  // 1. Fetch: block BEFORE request goes out
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url ? input.url : '');
    if (isSentry(url)) return Promise.resolve(new Response('{}', {status: 200, headers: {'content-type':'application/json'}}));
    return _fetch.apply(this, arguments);
  };

  // 2. XHR: block send() if URL targets Sentry
  var _XHR = window.XMLHttpRequest;
  var _open = _XHR.prototype.open;
  var _send = _XHR.prototype.send;
  _XHR.prototype.open = function(method, url) {
    this.__sentryBlocked = isSentry(url);
    if (!this.__sentryBlocked) _open.apply(this, arguments);
  };
  _XHR.prototype.send = function() {
    if (this.__sentryBlocked) {
      // Fire fake readystatechange so callers don't hang
      var self = this;
      Object.defineProperty(self, 'readyState', {get:function(){return 4}, configurable:true});
      Object.defineProperty(self, 'status', {get:function(){return 200}, configurable:true});
      Object.defineProperty(self, 'responseText', {get:function(){return '{}'}, configurable:true});
      setTimeout(function(){ if(typeof self.onreadystatechange==='function') self.onreadystatechange(); }, 0);
      return;
    }
    _send.apply(this, arguments);
  };

  // 3. SendBeacon
  var _beacon = navigator.sendBeacon;
  navigator.sendBeacon = function(url) {
    if (isSentry(url)) return true;
    return _beacon.apply(navigator, arguments);
  };

  // 4. Catch unhandled rejections from Sentry
  window.addEventListener('unhandledrejection', function(e) {
    if (e.reason && typeof e.reason.message === 'string' && (e.reason.message.indexOf('sentry')!==-1 || e.reason.message.indexOf('ERR_NAME_NOT_RESOLVED')!==-1)) {
      e.preventDefault();
    }
  });
})();
</script>
`

  // Inject right after <head>
  if (!html.includes('Block ALL Sentry requests')) {
    html = html.replace('<head>', '<head>' + proxyScript)
    fs.writeFileSync(indexHtmlPath, html, 'utf8')
    console.log('Successfully injected Sentry Adblocker bypass into index.html')
  } else {
    console.log('Sentry bypass already injected.')
  }
} else {
  console.log('dist/index.html not found, skipping Sentry bypass injection.')
}
