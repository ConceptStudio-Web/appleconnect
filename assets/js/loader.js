(function () {
  try {
    var start = Date.now();
    // Preload loader image early to avoid flicker/lag
    try {
      var preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.href = 'assets/load.png';
      document.head && document.head.appendChild(preload);
    } catch (_) { }

    if (!document.getElementById('ac-loader')) {
      var wrap = document.createElement('div');
      wrap.id = 'ac-loader';
      wrap.innerHTML = `
        <div class="ac-loader-inner">
          <img class="ac-logo" src="assets/load.png" alt="Loading" decoding="async" fetchpriority="high" />
          <div class="line-loader"></div>
        </div>`;
      document.documentElement.appendChild(wrap);
    }

    function hide() {
      var el = document.getElementById('ac-loader');
      if (!el) return;
      var elapsed = Date.now() - start;
      var wait = Math.max(0, 1000 - elapsed); // ensure ~1s minimum visibility
      setTimeout(function () {
        el.classList.add('hide');
        setTimeout(function () { try { el.remove(); } catch (_) { } }, 500);
      }, wait);
    }

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide, { once: true });
      // Safety timeout (in case load never fires due to blocked resources)
      setTimeout(hide, 8000);
    }
  } catch (_) { }
})();
