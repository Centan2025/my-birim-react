// 1. Erken Konsol Uyarılarını Gizle (Örn: Vercel/Sentry Zustand "Default export is deprecated")
// Bu script React'ten ve Vercel'in kendi enjekte ettiği scriptlerden bile önce çalışmalıdır.
;(function () {
  var originalWarn = console.warn
  console.warn = function () {
    var msg = Array.prototype.join.call(arguments, ' ')
    if (
      msg.indexOf('zustand') !== -1 ||
      msg.indexOf('Default export is deprecated') !== -1 ||
      msg.indexOf('instrument') !== -1 ||
      msg.indexOf('Video yükleme uyarısı') !== -1
    )
      return
    originalWarn.apply(console, arguments)
  }
  var originalLog = console.log
  console.log = function () {
    var msg = Array.prototype.join.call(arguments, ' ')
    if (
      msg.indexOf('[DEPRECATED]') !== -1 ||
      msg.indexOf('Default export is deprecated') !== -1 ||
      (msg.indexOf('zustand') !== -1 && msg.indexOf('deprecated') !== -1)
    )
      return
    originalLog.apply(console, arguments)
  }

  // 2. CSS Yükleme Hatası Kurtarıcısı (Vercel Cache / MIME Type Hatası)
  // Eğer eski cihazlarda önbelleğe alınmış index.html eski bir CSS dosyasını isterse
  // Vercel 404 HTML döner ve CSS MIME type hatası fırlatır. Bunu yakalayıp hard-reload yaparız.
  window.addEventListener(
    'error',
    function (e) {
      var target = e.target || e.srcElement
      var isLink = target && target.tagName === 'LINK'
      var isStyle = target && target.rel === 'stylesheet'

      if (isLink && isStyle) {
        // Sonsuz döngüyü engelle: Sadece bir kere yenile
        if (!sessionStorage.getItem('__birim_css_retry')) {
          console.warn('CSS load failed, forcing hard reload to clear cache')
          sessionStorage.setItem('__birim_css_retry', 'true')
          window.location.reload(true)
        }
      }
    },
    true
  ) // Use capture to catch network errors before they bubble
})()
