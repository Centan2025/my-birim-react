/**
 * SHIM: Prevention of 'Element is not defined' and other browser-only globals
 * during Sanity CLI schema extraction in Node.js environments.
 */
if (typeof window === 'undefined') {
  const noop = () => {}
  const mockClass = class {}
  // @ts-ignore
  globalThis.window = globalThis.window || {}
  // @ts-ignore
  globalThis.document = globalThis.document || {
    createElement: () => ({
      style: {},
      appendChild: noop,
      removeChild: noop,
      setAttribute: noop,
      getAttribute: () => null,
      classList: {add: noop, remove: noop},
    }),
    getElementById: () => null,
    querySelectorAll: () => [],
    documentElement: {style: {}},
    body: {appendChild: noop, style: {}},
    head: {appendChild: noop},
    activeElement: null,
  }
  // @ts-ignore
  globalThis.Element = globalThis.Element || mockClass
  // @ts-ignore
  globalThis.HTMLElement =
    globalThis.HTMLElement || class HTMLElement extends (globalThis.Element as any) {}
  // @ts-ignore
  globalThis.HTMLDivElement =
    globalThis.HTMLDivElement || class extends (globalThis.HTMLElement as any) {}
  // @ts-ignore
  if (!globalThis.Element.prototype.matches) globalThis.Element.prototype.matches = () => false
  // @ts-ignore
  if (!globalThis.Element.prototype.closest) globalThis.Element.prototype.closest = () => null
  // @ts-ignore
  globalThis.navigator = globalThis.navigator || {userAgent: 'node'}
}

import {defineCliConfig} from 'sanity/cli'
import path from 'path'

export default defineCliConfig({
  api: {
    projectId: 'wn3a082f',
    dataset: 'production',
  },
  studioHost: 'birim',
  deployment: {
    appId: 'uhq1n1x3jfninkphme61bf2x',
  },
  vite: (config) => {
    return {
      ...config,
      server: {
        ...config.server,
        hmr: {
          overlay: false,
        },
      },
      optimizeDeps: {
        ...config.optimizeDeps,
        exclude: [
          ...(config.optimizeDeps?.exclude || []),
          '@sentry/react',
          '@sentry/browser',
          '@sentry/core',
          '@sentry/react-router',
          '@sentry/utils',
          '@sentry/hub',
          '@sentry/types',
          '@sentry/integrations',
        ],
      },
      plugins: [
        ...(config.plugins || []),
        {
          name: 'sentry-blocker',
          transformIndexHtml(html) {
            const blockerScript = `
<script>
(function() {
  var BLOCK = ['sentry.io', 'ingest.us.sentry.io', 'api.vector.co', 'sanity.io/v2025-02-19/agent', '/presence/', '/tasks/', '/schedule/'];
  function isBlocked(u) { 
    var s = String(u||''); 
    return BLOCK.some(function(d){return s.indexOf(d)!==-1}); 
  }
  
  // 1. Fetch
  var _fetch = window.fetch;
  window.fetch = function(input, init) {
    var url = (typeof input === 'string') ? input : (input && input.url ? input.url : (input && input.href ? input.href : ''));
    if (isBlocked(url)) return Promise.resolve(new Response('{}', {status: 200, headers: {'content-type':'application/json'}}));
    return _fetch.apply(this, arguments);
  };

  // 2. XHR
  var _XHR = window.XMLHttpRequest;
  var _open = _XHR.prototype.open;
  var _send = _XHR.prototype.send;
  _XHR.prototype.open = function(method, url) {
    this.__blocked = isBlocked(url);
    if (!this.__blocked) _open.apply(this, arguments);
  };
  _XHR.prototype.send = function() {
    if (this.__blocked) {
      var self = this;
      Object.defineProperty(self, 'readyState', {get:function(){return 4}, configurable:true});
      Object.defineProperty(self, 'status', {get:function(){return 200}, configurable:true});
      Object.defineProperty(self, 'responseText', {get:function(){return '{}'}, configurable:true});
      setTimeout(function(){ 
        if(typeof self.onreadystatechange==='function') self.onreadystatechange(); 
        if(typeof self.onload==='function') self.onload();
      }, 0);
      return;
    }
    _send.apply(this, arguments);
  };

  // 3. Beacon
  var _beacon = navigator.sendBeacon;
  if (_beacon) {
    navigator.sendBeacon = function(url) {
      if (isBlocked(url)) return true;
      return _beacon.apply(navigator, arguments);
    };
  }

  // 4. Image (Pixel) Tracking
  var _Image = window.Image;
  window.Image = function() {
    var img = new _Image();
    var _src = '';
    Object.defineProperty(img, 'src', {
      get: function() { return _src; },
      set: function(val) {
        _src = val;
        if (isBlocked(val)) {
          setTimeout(function() { if (img.onload) img.onload(); }, 0);
          return;
        }
        img.setAttribute('src', val);
      }
    });
    return img;
  };

  // 5. Script Element Blocking
  var _createElement = document.createElement;
  document.createElement = function(tag) {
    var el = _createElement.apply(document, arguments);
    if (tag.toLowerCase() === 'script') {
      var _src = '';
      Object.defineProperty(el, 'src', {
        get: function() { return _src; },
        set: function(val) {
          _src = val;
          if (isBlocked(val)) return;
          el.setAttribute('src', val);
        }
      });
    }
    return el;
  };

  // 6. Console Silencing (Enhanced for QUIC and Protocol errors)
  var _error = console.error;
  var _warn = console.warn;
  var _log = console.log;

  var noise = ['sentry', 'WebSocket', 'ERR_QUIC_PROTOCOL_ERROR', 'ERR_CONNECTION_REFUSED', 'failed to load resource', 'sanity.io/v2025-02-19/agent', '/presence/', '/tasks/', 'WebSocket connection to'];
  function isNoise(m) {
    var s = String(m||'');
    return noise.some(function(n){ return s.indexOf(n) !== -1 });
  }

  console.error = function() {
    if (isNoise(arguments[0]) || isNoise(Array.prototype.join.call(arguments, ' '))) return;
    _error.apply(console, arguments);
  };
  console.warn = function() {
    if (isNoise(arguments[0])) return;
    _warn.apply(console, arguments);
  };
  console.log = function() {
    if (isNoise(arguments[0])) return;
    _log.apply(console, arguments);
  };

  window.addEventListener('error', function(e) {
    if (isNoise(e.message) || isNoise(e.filename)) e.preventDefault();
  }, true);

  window.addEventListener('unhandledrejection', function(e) {
    var msg = String(e.reason && e.reason.message || '');
    if (isNoise(msg)) e.preventDefault();
  });
})();
</script>
`
            return html.replace('<head>', '<head>' + blockerScript)
          },
        },
      ],
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@sentry/react': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/browser': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/core': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/react-router': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/utils': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/hub': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/types': path.resolve(__dirname, './scripts/dummy-sentry.js'),
          '@sentry/integrations': path.resolve(__dirname, './scripts/dummy-sentry.js'),
        },
      },
    }
  },
})
