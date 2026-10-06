// Opscope website: small, dependency-free interactions.
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  var THEME_KEY = 'opscope-site-theme';

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // ---------- Theme ----------
  var toggle = $('[data-theme-toggle]');
  function setThemeLabel() {
    var next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    toggle.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }
  function applyTheme(theme) {
    doc.dataset.theme = theme;
    setThemeLabel();
  }
  setThemeLabel();

  toggle.addEventListener('click', function (e) {
    var next = doc.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch (err) {}

    if (!document.startViewTransition || reduceMotion.matches) { applyTheme(next); return; }

    // Grow the new theme out of the button in a circle.
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(function () { applyTheme(next); });
    t.ready.then(function () {
      doc.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.65, 0, .35, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  // Follow the system while the visitor hasn't picked a theme.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });

  // ---------- Nav: border on scroll, current section ----------
  var nav = $('[data-nav]');
  var navLinks = $$('.nav-links a');
  function onScrollNav() { nav.classList.toggle('is-scrolled', scrollY > 8); }
  onScrollNav();
  addEventListener('scroll', onScrollNav, { passive: true });

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.forEach(function (a) {
        a.classList.toggle('is-current', a.getAttribute('href') === '#' + entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['top', 'problem', 'solution', 'features', 'install', 'fine-print'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  // ---------- Reveal on scroll ----------
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
      entry.target.dispatchEvent(new CustomEvent('reveal'));
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  $$('.reveal, [data-shot]').forEach(function (el) { revealObserver.observe(el); });

  // ---------- Pupils follow the pointer ----------
  var pupils = $$('[data-pupil]').map(function (el) { return { el: el, x: 0, y: 0, tx: 0, ty: 0 }; });
  var pointer = null;
  var MAX = 2.25; // SVG units: the lens hole (r 7) minus the pupil (r 4.25), less a hair

  addEventListener('pointermove', function (e) { pointer = { x: e.clientX, y: e.clientY }; }, { passive: true });
  document.addEventListener('pointerleave', function () { pointer = null; });

  function pupilFrame(time) {
    pupils.forEach(function (p, i) {
      var svg = p.el.ownerSVGElement;
      var rect = svg.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      var box = svg.viewBox.baseVal;
      var scale = rect.width / box.width;
      var cx = rect.left + (24 - box.x) * scale;
      var cy = rect.top + (19 - box.y) * scale;

      if (pointer && finePointer.matches) {
        var dx = pointer.x - cx, dy = pointer.y - cy;
        var dist = Math.hypot(dx, dy) || 1;
        var reach = MAX * clamp(dist / 360, 0, 1);
        p.tx = dx / dist * reach;
        p.ty = dy / dist * reach;
      } else {
        // No mouse: look around slowly, like it's scanning the cluster.
        var t = time / 1000 + i * 2;
        p.tx = Math.cos(t * 0.7) * MAX * 0.8;
        p.ty = Math.sin(t * 1.1) * MAX * 0.5;
      }
      p.x += (p.tx - p.x) * 0.12;
      p.y += (p.ty - p.y) * 0.12;
      p.el.setAttribute('transform', 'translate(' + p.x.toFixed(3) + ' ' + p.y.toFixed(3) + ')');
    });
    requestAnimationFrame(pupilFrame);
  }
  if (!reduceMotion.matches && pupils.length) requestAnimationFrame(pupilFrame);

  // ---------- Problem: scroll story ----------
  var stage = $('[data-stage]');
  var steps = $$('[data-step-i]');
  var screens = $$('[data-screen]');
  var foots = $$('[data-foot]');
  var titles = ['zsh · ~/oncall', 'zsh · ~/oncall', 'cluster-admin-dashboard.yaml'];
  var termTitle = $('[data-term-title]');
  var currentStep = 0;

  function showStep(i) {
    if (i === currentStep) return;
    currentStep = i;
    stage.dataset.step = i;
    steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
    screens.forEach(function (s, n) {
      s.classList.remove('is-on');
      if (n === i) { void s.offsetWidth; s.classList.add('is-on'); } // restart line animations
    });
    foots.forEach(function (f, n) { f.classList.toggle('is-on', n === i); });
    termTitle.textContent = titles[i];
  }

  var stepObserver;
  function observeSteps() {
    if (stepObserver) stepObserver.disconnect();
    var narrow = innerWidth <= 900;
    stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) showStep(Number(entry.target.dataset.stepI));
      });
    }, { rootMargin: narrow ? '-62% 0px -30% 0px' : '-48% 0px -48% 0px' });
    steps.forEach(function (s) { stepObserver.observe(s); });
  }
  observeSteps();
  var resizeTimer;
  addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(observeSteps, 200); });

  // ---------- Solution: the screenshot settles flat as it scrolls in ----------
  var shot = $('[data-shot]');
  var shotTicking = false;
  function updateShot() {
    shotTicking = false;
    var rect = shot.getBoundingClientRect();
    var p = clamp((innerHeight - rect.top) / (innerHeight * 0.85), 0, 1);
    var e = 1 - Math.pow(1 - p, 3);
    shot.style.transform =
      'rotateX(' + ((1 - e) * 22).toFixed(2) + 'deg) scale(' + (0.88 + 0.12 * e).toFixed(4) + ') translateY(' + ((1 - e) * 40).toFixed(1) + 'px)';
  }
  if (shot && !reduceMotion.matches) {
    updateShot();
    addEventListener('scroll', function () {
      if (!shotTicking) { shotTicking = true; requestAnimationFrame(updateShot); }
    }, { passive: true });
  }

  // ---------- Count up ----------
  $$('[data-count]').forEach(function (el) {
    var target = Number(el.dataset.count);
    var host = el.closest('.reveal') || el;
    if (reduceMotion.matches || target < 3) return;
    el.textContent = '0';
    host.addEventListener('reveal', function () {
      var start = performance.now(), dur = 1400;
      (function frame(now) {
        var t = clamp((now - start) / dur, 0, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(frame);
      })(start);
    });
  });

  // ---------- Sparkline: a believable 15 minutes of memory use ----------
  (function () {
    var line = $('[data-spark]'), area = $('[data-spark-area]'), now = $('[data-spark-now]');
    if (!line) return;
    var n = 60, pts = [], v = 0.52;
    for (var i = 0; i < n; i++) {
      v += (Math.sin(i * 0.9) * 0.012) + (Math.cos(i * 0.37) * 0.018) + (i === 34 ? 0.09 : 0) + (i > 34 ? -0.0016 : 0.0012);
      pts.push(clamp(v, 0.3, 0.8));
    }
    var W = 200, H = 56;
    var d = pts.map(function (p, i) {
      return (i ? 'L' : 'M') + (i / (n - 1) * W).toFixed(1) + ' ' + (H - p * H).toFixed(1);
    }).join(' ');
    line.setAttribute('d', d);
    line.setAttribute('pathLength', '1');
    area.setAttribute('d', d + ' L' + W + ' ' + H + ' L0 ' + H + ' Z');
    now.setAttribute('cy', (H - pts[n - 1] * H).toFixed(1));
  })();

  // ---------- Secret reveal (a public certificate, like the real app's tests) ----------
  $$('[data-reveal]').forEach(function (btn) {
    var val = btn.parentElement.querySelector('[data-secret-val]');
    var masked = val.textContent;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.textContent = open ? 'Reveal' : 'Hide';
      val.textContent = open ? masked : '-----BEGIN CERTIFICATE----- MIIDazCCAlOgAwIBAgIU…';
      val.classList.toggle('is-shown', !open);
    });
  });

  // ---------- Light / dark compare ----------
  $$('[data-compare]').forEach(function (box) {
    var range = box.querySelector('.cmp-range');
    function set() { box.style.setProperty('--pos', range.value + '%'); }
    range.addEventListener('input', set);
    // Hint that it moves, once, when it first comes into view.
    if (!reduceMotion.matches) {
      box.closest('.reveal').addEventListener('reveal', function () {
        var start = performance.now();
        (function frame(now) {
          if (box.dataset.touched) return;
          var t = clamp((now - start) / 1600, 0, 1);
          range.value = 50 + Math.sin(t * Math.PI * 2) * 18 * (1 - t);
          set();
          if (t < 1) requestAnimationFrame(frame);
        })(start);
      });
    }
    range.addEventListener('pointerdown', function () { box.dataset.touched = '1'; });
    range.addEventListener('keydown', function () { box.dataset.touched = '1'; });
  });

  // ---------- Filter demo: types "crash" while in view ----------
  (function () {
    var demo = $('[data-filter-demo]');
    if (!demo) return;
    var text = $('[data-filter-text]', demo);
    var input = $('.flt-input', demo);
    var word = 'crash';
    if (reduceMotion.matches) { text.textContent = word; demo.classList.add('is-filtered'); return; }

    var timer = null, visible = false;
    function run() {
      var i = 0;
      text.textContent = '';
      demo.classList.remove('is-filtered');
      input.classList.add('is-typing');
      (function type() {
        if (!visible) return;
        i++;
        text.textContent = word.slice(0, i);
        if (i === 2) demo.classList.add('is-filtered');
        if (i < word.length) timer = setTimeout(type, 140 + Math.random() * 90);
        else timer = setTimeout(function () { input.classList.remove('is-typing'); timer = setTimeout(run, 3200); }, 400);
      })();
    }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      clearTimeout(timer);
      if (visible) timer = setTimeout(run, 600);
    }, { threshold: 0.4 }).observe(demo);
  })();

  // ---------- Install tabs ----------
  (function () {
    var list = $('[data-tabs]');
    if (!list) return;
    var tabs = $$('[role="tab"]', list);
    var ind = $('.tabs-ind', list);

    function moveIndicator(tab) {
      ind.style.width = tab.offsetWidth - 28 + 'px';
      ind.style.transform = 'translateX(' + (tab.offsetLeft + 14) + 'px)';
    }
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      moveIndicator(tab);
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab); });
      tab.addEventListener('keydown', function (e) {
        var j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') j = 0;
        if (e.key === 'End') j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(tabs[j], true); }
      });
    });
    var selected = tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0];
    moveIndicator(selected);
    addEventListener('resize', function () { moveIndicator($('[aria-selected="true"]', list)); });
    if (document.fonts) document.fonts.ready.then(function () { moveIndicator($('[aria-selected="true"]', list)); });
  })();

  // ---------- Copy buttons ----------
  var CHECK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  $$('[data-copy]').forEach(function (btn) {
    var original = btn.innerHTML, label = btn.getAttribute('aria-label');
    btn.addEventListener('click', function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(btn.dataset.copy).then(function () {
        btn.innerHTML = CHECK;
        btn.classList.add('is-done');
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(function () {
          btn.innerHTML = original;
          btn.classList.remove('is-done');
          btn.setAttribute('aria-label', label);
        }, 1600);
      });
    });
  });

  // ---------- GitHub stars (quietly skipped if the API says no) ----------
  (function () {
    var el = $('[data-stars]');
    if (!el || !window.fetch) return;
    fetch('https://api.github.com/repos/unnikrishnanNam/OpScope', { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.stargazers_count) return;
        var n = data.stargazers_count;
        el.textContent = n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
        el.setAttribute('aria-label', n + ' stars');
        el.hidden = false;
      })
      .catch(function () {});
  })();
})();
