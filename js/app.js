/* ==========================================================================
   Update Development Depo — app.js
   Tanpa dependency / build step. Cukup deploy folder ini ke Vercel.
   ========================================================================== */
(() => {
  'use strict';

  const STAGE_W = 1334, STAGE_H = 750;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const stage = $('#stage');
  const slides = $$('.slide');
  const total = slides.length;
  let cur = -1;
  let outTimer = null;
  const rafs = new Map();

  /* ------------------------------------------------------------------ *
   * Scale stage ke viewport (letterbox 16:9)
   * ------------------------------------------------------------------ */
  function fit() {
    const s = Math.min(innerWidth / STAGE_W, innerHeight / STAGE_H);
    stage.style.setProperty('--s', s.toFixed(4));
    // tanpa margin saat jendela hampir 16:9 supaya terasa full
    stage.dataset.scale = s;
  }
  addEventListener('resize', fit);
  fit();

  /* ------------------------------------------------------------------ *
   * Count-up
   * ------------------------------------------------------------------ */
  function fmt(v, el) {
    const dec = +(el.dataset.dec || 0);
    const sep = el.dataset.sep || '.';
    const th = el.dataset.th || '';
    let s = Math.abs(v).toFixed(dec);
    let [i, d] = s.split('.');
    if (th) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, th);
    s = d ? i + sep + d : i;
    const neg = v < 0 || el.dataset.neg === '1';
    return (el.dataset.prefix || '') + (neg ? '−' : '') + s + (el.dataset.suffix || '');
  }
  function resetCounts(slide) {
    $$('[data-count]', slide).forEach(el => {
      cancelAnimationFrame(rafs.get(el));
      el.textContent = fmt(0, el);
    });
  }
  function runCounts(slide) {
    $$('[data-count]', slide).forEach(el => {
      const to = parseFloat(el.dataset.to);
      const delay = parseFloat(el.dataset.delay || 0) * 1000;
      const dur = parseFloat(el.dataset.dur || 1500);
      let t0 = null;
      const step = ts => {
        if (t0 === null) t0 = ts;
        const p = Math.min(1, Math.max(0, (ts - t0 - delay) / dur));
        const e = 1 - Math.pow(1 - p, 4); // easeOutQuart
        el.textContent = fmt(to * e, el);
        if (p < 1) rafs.set(el, requestAnimationFrame(step));
      };
      rafs.set(el, requestAnimationFrame(step));
    });
  }

  /* ------------------------------------------------------------------ *
   * Navigasi
   * ------------------------------------------------------------------ */
  const prog = $('#prog');
  const cnt = $('#cnt');
  const dots = $('#dots');
  slides.forEach((_, i) => {
    const d = document.createElement('i');
    d.addEventListener('click', () => go(i));
    dots.appendChild(d);
  });

  function go(n) {
    n = Math.max(0, Math.min(total - 1, n));
    if (n === cur) return;
    const prev = slides[cur];
    const next = slides[n];

    if (prev) {
      prev.classList.remove('on');
      prev.classList.add('out');
      $$('video', prev).forEach(v => v.pause());
      clearTimeout(outTimer);
      outTimer = setTimeout(() => {
        $$('.slide.out').forEach(s => { s.classList.remove('out'); resetCounts(s); });
      }, 700);
    }
    // pastikan slide tujuan bersih sebelum diputar ulang
    next.classList.remove('out');
    resetCounts(next);
    void next.offsetWidth;                 // force reflow supaya transisi terulang
    next.classList.add('on');
    requestAnimationFrame(() => runCounts(next));

    cur = n;
    prog.style.width = ((n + 1) / total * 100) + '%';
    cnt.innerHTML = `<b>${String(n + 1).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')}`;
    $$('#dots i').forEach((d, i) => d.classList.toggle('on', i === n));
    history.replaceState(null, '', '#' + (n + 1));
  }
  const next = () => go(cur + 1);
  const prevSlide = () => go(cur - 1);

  addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if ($('#lb.open')) { if (e.key === 'Escape' || e.key === ' ') closeLB(); return; }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prevSlide(); break;
      case 'Home': go(0); break;
      case 'End': go(total - 1); break;
      case 'f': case 'F': toggleFS(); break;
      case 'l': case 'L': { const b = $('[data-act="labels"]'); b && b.click(); break; }
    }
  });
  $('#btn-prev').addEventListener('click', prevSlide);
  $('#btn-next').addEventListener('click', next);
  $('#btn-fs').addEventListener('click', toggleFS);

  function toggleFS() {
    const d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen || (() => {})).call(d.documentElement);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen || (() => {})).call(d);
    }
  }

  // swipe
  let sx = null, sy = null;
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') { sx = e.clientX; sy = e.clientY; } });
  addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) dx < 0 ? next() : prevSlide();
    sx = sy = null;
  });

  // HUD auto-hide
  let idleT;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idleT);
    idleT = setTimeout(() => document.body.classList.add('idle'), 2800);
  };
  ['mousemove', 'pointerdown', 'keydown', 'touchstart'].forEach(ev => addEventListener(ev, wake, { passive: true }));
  wake();

  /* ------------------------------------------------------------------ *
   * Lightbox (klik gambar untuk zoom)
   * ------------------------------------------------------------------ */
  const lb = $('#lb');
  const lbImg = $('img', lb);
  function openLB(src) { lbImg.src = src; lb.classList.add('open'); }
  function closeLB() { lb.classList.remove('open'); }
  lb.addEventListener('click', closeLB);
  document.addEventListener('click', e => {
    const img = e.target.closest('.zoomable img, img.o-bg');
    if (img) openLB(img.currentSrc || img.src);
  });

  /* ------------------------------------------------------------------ *
   * Chart Trend Sales (slide 4) — data dibaca dari label grafik asli
   * ------------------------------------------------------------------ */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const SERIES = [
    { k: 'green',  name: 'Branch Kapuk',  c: '#1E7B3C', d: .5,
      v: [9670,8866,6629,6994,8711,8839,10017,9015,9356,9441,9083,9925,11203,10343,6360,10824,10640,11404,12185,11422,10878,11770] },
    { k: 'orange', name: 'Depo Kapuk',    c: '#F07E26', d: .75,
      v: [6186,5920,4575,4447,5596,5869,6293,5684,5976,6052,5577,6662,7255,7148,4623,7215,7163,7598,8114,7664,7119,7737] },
    { k: 'blue',   name: 'SP Kebayoran',  c: '#1D5B8C', d: 1.0,
      v: [3484,2947,2054,2547,3115,2969,3724,3331,3380,3389,3507,3263,3948,3195,1737,3610,3477,3806,4070,3759,3759,4033] },
  ];
  const N = SERIES[0].v.length;
  const mLabel = i => MONTHS[i % 12] + ' ' + (2025 + Math.floor(i / 12));
  const nf = v => v.toLocaleString('en-US');

  function buildTrend() {
    const svg = $('#trend');
    if (!svg) return;
    const W = 960, H = 284, ml = 40, mr = 88, mt = 8, mb = 40;
    const pw = W - ml - mr, ph = H - mt - mb, step = pw / (N - 1), YMAX = 14000;
    const X = i => ml + i * step;
    const Y = v => mt + (1 - v / YMAX) * ph;
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (tag, attrs = {}, parent) => {
      const el = document.createElementNS(NS, tag);
      for (const k in attrs) el.setAttribute(k, attrs[k]);
      parent && parent.appendChild(el);
      return el;
    };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // grid + sumbu Y
    const g = mk('g', { class: 't-grid t-axis' }, svg);
    for (let v = 0; v <= YMAX; v += 2000) {
      mk('line', { x1: ml, x2: ml + pw + 10, y1: Y(v), y2: Y(v) }, g);
      const t = mk('text', { x: ml - 8, y: Y(v) + 3.2, 'text-anchor': 'end' }, g);
      t.textContent = nf(v);
    }
    // sumbu X
    const ax = mk('g', { class: 't-axis' }, svg);
    for (let i = 0; i < N; i++) {
      const t = mk('text', { x: X(i), y: mt + ph + 16, 'text-anchor': 'middle' }, ax);
      t.textContent = MONTHS[i % 12];
    }
    const yr = mk('g', { class: 't-year' }, svg);
    [[0, 11, '2025'], [12, 21, '2026']].forEach(([a, b, label]) => {
      const t = mk('text', { x: (X(a) + X(b)) / 2, y: mt + ph + 33, 'text-anchor': 'middle' }, yr);
      t.textContent = label;
      mk('line', { x1: X(a) - step / 2 + 3, x2: X(b) + step / 2 - 3, y1: mt + ph + 22, y2: mt + ph + 22 }, yr);
    });

    // crosshair
    const cross = mk('line', { class: 't-cross', y1: mt, y2: mt + ph, x1: 0, x2: 0 }, svg);

    const hot = [];
    SERIES.forEach(s => {
      const grp = mk('g', { class: 't-ser', 'data-k': s.k }, svg);

      // garis tren linear (regresi)
      const n = N, xs = [...Array(n).keys()];
      const mx = xs.reduce((a, b) => a + b, 0) / n, my = s.v.reduce((a, b) => a + b, 0) / n;
      const b1 = xs.reduce((a, x, i) => a + (x - mx) * (s.v[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0);
      const b0 = my - b1 * mx;
      mk('line', { class: 't-trend', x1: X(0), y1: Y(b0), x2: X(n - 1), y2: Y(b0 + b1 * (n - 1)), stroke: s.c, style: `--d:${2.6 + s.d}s` }, grp);

      // garis utama
      const d = s.v.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join('');
      mk('path', { class: 't-line', d, stroke: s.c, pathLength: 1, style: `--d:${s.d}s` }, grp);

      // titik
      s.v.forEach((v, i) => {
        mk('circle', { class: 't-dot', cx: X(i), cy: Y(v), r: 3.1, fill: s.c, style: `--d:${s.d + .25 + (i / (N - 1)) * 1.75}s` }, grp);
      });

      // label nilai (toggle)
      s.v.forEach((v, i) => {
        const t = mk('text', { class: 't-vl', x: X(i), y: Y(v) + (s.k === 'blue' ? 17 : -9), 'text-anchor': 'middle', fill: s.c }, grp);
        t.textContent = nf(v);
      });

      // label akhir
      const e = mk('g', { class: 't-end', style: `--d:${s.d + 2.0}s` }, grp);
      const lv = mk('text', { class: 'v', x: X(N - 1) + 13, y: Y(s.v[N - 1]) + 1, fill: s.c }, e);
      lv.textContent = nf(s.v[N - 1]);
      const ln = mk('text', { class: 'n', x: X(N - 1) + 13, y: Y(s.v[N - 1]) + 13 }, e);
      ln.textContent = s.name.toUpperCase();

      // titik hover
      hot.push(mk('circle', { class: 't-hot', r: 5.6, fill: s.c, cx: 0, cy: 0 }, grp));
    });

    // area interaksi
    const wrap = $('#trend-wrap');
    const tip = $('.t-tip', wrap);
    const catcher = mk('rect', { x: ml - step / 2, y: mt, width: pw + step, height: ph, fill: 'transparent' }, svg);
    const move = e => {
      const r = svg.getBoundingClientRect();
      const k = r.width / W;
      const px = (e.clientX - r.left) / k;
      const i = Math.max(0, Math.min(N - 1, Math.round((px - ml) / step)));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i));
      SERIES.forEach((s, j) => { hot[j].setAttribute('cx', X(i)); hot[j].setAttribute('cy', Y(s.v[i])); });
      svg.classList.add('t-hover');
      const vis = SERIES.filter(s => !$(`.t-ser[data-k="${s.k}"]`, svg).classList.contains('off'));
      tip.innerHTML = `<h4>${mLabel(i)}</h4>` + vis.map(s =>
        `<div><span><i style="background:${s.c}"></i>${s.name}</span>${nf(s.v[i])}</div>`).join('');
      tip.classList.add('show');
      const tw = tip.offsetWidth || 150;
      let left = X(i) + 16;
      if (left + tw > W - 6) left = X(i) - tw - 16;
      tip.style.left = left + 'px';
      tip.style.top = Math.max(0, Math.min(ph - 70, Y(Math.max(...vis.map(s => s.v[i]), 0)) - 4)) + 'px';
    };
    catcher.addEventListener('pointermove', move);
    catcher.addEventListener('pointerdown', move);
    catcher.addEventListener('pointerleave', () => { svg.classList.remove('t-hover'); tip.classList.remove('show'); });

    // kontrol
    $$('.chip[data-k]').forEach(btn => btn.addEventListener('click', () => {
      const grp = $(`.t-ser[data-k="${btn.dataset.k}"]`, svg);
      grp.classList.toggle('off');
      btn.classList.toggle('off', grp.classList.contains('off'));
    }));
    const lab = $('[data-act="labels"]');
    lab.addEventListener('click', () => { lab.classList.toggle('on'); svg.classList.toggle('labels'); });
    const org = $('[data-act="orig"]');
    org.addEventListener('click', () => { org.classList.toggle('on'); $('.t-orig').classList.toggle('show'); });
  }
  buildTrend();

  /* ------------------------------------------------------------------ *
   * Start
   * ------------------------------------------------------------------ */
  const start = Math.max(1, Math.min(total, parseInt(location.hash.slice(1), 10) || 1)) - 1;
  go(start);
})();
