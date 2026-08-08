(function () {
  window.__dcWhen = function (id, fn) {
    var done = false;
    function tryRun() {
      if (done) return true;
      var el = document.getElementById(id);
      if (!el) return false;
      done = true;
      fn(el);
      return true;
    }
    if (tryRun()) return;
    var mo = new MutationObserver(function () { if (tryRun()) mo.disconnect(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  };

  /* Cal.com loader */
  (function (C, A, L) {
    var p = function (a, ar) { a.q.push(ar); };
    var d = C.document;
    C.Cal = C.Cal || function () {
      var cal = C.Cal, ar = arguments;
      if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
      if (ar[0] === L) {
        var api = function () { p(api, arguments); };
        var namespace = ar[1];
        api.q = api.q || [];
        if (typeof namespace === "string") { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]); }
        else p(cal, ar);
        return;
      }
      p(cal, ar);
    };
  })(window, "https://app.cal.com/embed/embed.js", "init");

  window.__initCalEmbed = function () {
    if (window.__calEmbedLoaded) return;
    window.__calEmbedLoaded = true;
    Cal("init", "drye", { origin: "https://cal.com" });
    try {
      Cal.ns.drye("inline", {
        elementOrSelector: "#cal-inline",
        calLink: "wilhelm-backstrom-vo84vu/15min",
        config: { layout: "month_view" }
      });
      Cal.ns.drye("ui", {
        cssVarsPerTheme: { light: { "cal-brand": "#0D9488" } },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    } catch (e) { console.warn('Cal embed init failed', e); }
  };

  window.__dcWhen('cal-inline', function () {
    function check() {
      if (window.__calEmbedLoaded) return true;
      var el = document.getElementById('cal-inline');
      if (!el) return false;
      var r = el.getBoundingClientRect();
      if (window.innerHeight + 600 > r.top && r.bottom > -600) {
        window.__initCalEmbed();
        window.removeEventListener('scroll', check);
        return true;
      }
      return false;
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  });

  /* Body map — cycle a blue glow across zones to signal each affected area */
  window.__dcWhen('body-map-figure', function () {
    var i = 0, timer = null;
    function tick() {
      var fig = document.getElementById('body-map-figure');
      if (!fig) { clearInterval(timer); return; }
      var zones = Array.prototype.slice.call(fig.querySelectorAll('.body-map__zone'));
      if (!zones.length) return;
      zones.forEach(function (z) { z.classList.remove('is-glow'); });
      zones[i % zones.length].classList.add('is-glow');
      i++;
    }
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      tick();
      timer = setInterval(tick, 1100);
    }
  });

  /* Sticky nav — active-section pill */
  window.__dcWhen('site-nav', function () {
    function movePill(nav, pill, links, link) {
      if (!link) { pill.classList.remove('is-visible'); return; }
      var lr = link.getBoundingClientRect(), nr = nav.getBoundingClientRect();
      pill.style.width = lr.width + 'px';
      pill.style.transform = 'translateX(' + (lr.left - nr.left) + 'px)';
      pill.classList.add('is-visible');
      links.forEach(function (a) { a.classList.toggle('is-active', a === link); });
    }
    function onScroll() {
      var nav = document.getElementById('site-nav');
      var pill = document.getElementById('site-nav-pill');
      if (!nav || !pill) return;
      var links = Array.prototype.slice.call(nav.querySelectorAll('a[data-target]'));
      var bestLink = null, bestTop = Number.NEGATIVE_INFINITY;
      links.forEach(function (a) {
        var sec = document.getElementById(a.dataset.target);
        if (!sec) return;
        var r = sec.getBoundingClientRect();
        if (140 >= r.top && r.top > bestTop) { bestTop = r.top; bestLink = a; }
      });
      if (!bestLink) return;
      movePill(nav, pill, links, bestLink);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  });
})();
