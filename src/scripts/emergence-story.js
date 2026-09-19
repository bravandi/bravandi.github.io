/* <story-stage> — narrative particle simulation: data → insight → decision → value.
   Ten formations, each a stage of how evidence becomes a decision. Same overlay
   grammar as the emergence stage (live readout, caption, pager, prev/next/lock).
   Attributes: count, speed, hold, mono, controls, theme="light|dark" */
(function () {
  const VIOLET = '#8B5CF6', ORANGE = '#F97316', HOT = '#D9407E';
  const rnd = (i, s) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
  const cl = v => Math.max(0.02, Math.min(0.98, v));
  const smooth = x => x * x * (3 - 2 * x);

  const F = [
    { label: 'RAW SIGNAL', caption: 'Evidence arrives scattered — genomics, clinic, real world.',
      pos: i => [cl(rnd(i, 1)), cl(rnd(i, 2))], hot: () => false },
    { label: 'INGESTION', caption: 'Made tabular before it is made useful.',
      pos: (i, n) => { const c = 22, r = Math.floor(i / c), rows = Math.ceil(n / c);
        return [0.08 + (i % c) / (c - 1) * 0.84, 0.1 + (r / Math.max(1, rows - 1)) * 0.8]; }, hot: () => false },
    { label: 'HARMONIZATION', caption: 'Two vocabularies — biology and machine — learn to align.',
      pos: (i, n, pop) => { const k = Math.floor(i / 2) / Math.max(1, n / 2 - 1);
        return [0.06 + k * 0.88, 0.5 + (pop ? 1 : -1) * (0.07 + rnd(i, 5) * 0.04)]; }, hot: () => false },
    { label: 'KNOWLEDGE GRAPH', caption: 'Relationships become the asset, not the rows.', graph: true,
      pos: i => { const rings = [1, 10, 20, 30, 40, 52, 64, 76]; let a = 0, ri = 0;
        while (ri < rings.length - 1 && i >= a + rings[ri]) { a += rings[ri]; ri++; }
        const idx = i - a, cnt = rings[ri], ang = (idx / cnt) * Math.PI * 2 + ri * 0.4;
        const rad = 0.055 * ri + rnd(i, 7) * 0.012;
        return [cl(0.5 + Math.cos(ang) * rad * 1.5), cl(0.5 + Math.sin(ang) * rad * 1.9)]; },
      hot: i => i % 17 === 0 },
    { label: 'REPRESENTATION', caption: 'Diseases cluster by mechanism — rare beside common.',
      pos: i => { const C = [[0.24, 0.3], [0.5, 0.2], [0.76, 0.32], [0.2, 0.72], [0.5, 0.62], [0.8, 0.74]];
        const c = C[i % 6], t = rnd(i, 11) * Math.PI * 2, r = Math.sqrt(rnd(i, 12)) * 0.11;
        return [cl(c[0] + Math.cos(t) * r), cl(c[1] + Math.sin(t) * r * 1.25)]; },
      hot: i => i % 6 === 4 && rnd(i, 13) > 0.6 },
    { label: 'MODEL', caption: 'Capability, layered on foundations you can reuse.',
      pos: (i, n) => { const L = [0.12, 0.31, 0.5, 0.69, 0.88], per = Math.ceil(n / 5);
        const l = Math.min(4, Math.floor(i / per)), k = i % per;
        return [L[l], 0.12 + (k / Math.max(1, per - 1)) * 0.76]; }, hot: () => false },
    { label: 'BENCHMARK', caption: 'Nothing ships on a demo. It ships on a benchmark.',
      pos: (i, n) => { const side = i % 2, per = n / 2, k = Math.floor(i / 2) / Math.max(1, per - 1);
        const cols = 7, c = Math.floor(k * cols * 4) % cols;
        return [(side ? 0.62 : 0.22) + (c / (cols - 1)) * 0.16, 0.9 - k * (side ? 0.72 : 0.34)]; },
      hot: i => i % 2 === 1 },
    { label: 'INSIGHT', caption: 'Noise narrows into something a scientist can act on.',
      pos: (i, n) => { const k = i / (n - 1), spread = (1 - k) * 0.42 + 0.012;
        return [0.08 + k * 0.84, cl(0.5 + (rnd(i, 17) - 0.5) * 2 * spread)]; },
      hot: i => rnd(i, 19) > 0.93 },
    { label: 'DECISION', caption: 'Which asset, which indication, which evidence — and why.',
      pos: i => { const lvl = i % 4, br = Math.floor(i / 4) % (1 << lvl);
        let y = 0.5, step = 0.3;
        for (let b = 0; b < lvl; b++) { y += ((br >> b) & 1 ? 1 : -1) * step; step *= 0.5; }
        return [0.14 + lvl * 0.24 + rnd(i, 23) * 0.05, cl(y)]; },
      hot: i => i % 4 === 3 && Math.floor(i / 4) % 8 === 5 },
    { label: 'VALUE', caption: 'Measured where it counts: better decisions, sooner.',
      pos: (i, n) => { const k = i / (n - 1), x = 0.08 + k * 0.86, curve = 0.9 - Math.pow(k, 1.9) * 0.76;
        return rnd(i, 29) > 0.78
          ? [cl(x + (rnd(i, 31) - .5) * .1), cl(curve + 0.12 + rnd(i, 37) * 0.2)]
          : [x, cl(curve + (rnd(i, 41) - 0.5) * 0.03)]; },
      hot: i => rnd(i, 43) > 0.88 }
  ];
  const TRANS = 1500;
  const LINK_PX = 46;
  const rgb = (hex, fallback) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!m) return fallback;
    const v = parseInt(m[1], 16);
    return (v >> 16) + ',' + ((v >> 8) & 255) + ',' + (v & 255);
  };
  const WIDEST = F.reduce((a, b) => (b.label.length > a.length ? b.label : a), '');

  class StoryStage extends HTMLElement {
    connectedCallback() {
      if (this._built) {
        this._fit();
        this.visible = true;
        this.last = performance.now();
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(this._loop);
        if (this._ro) this._ro.observe(this);
        if (this._io) this._io.observe(this);
        return;
      }
      this._built = true;
      this.dark = this.getAttribute('theme') === 'dark';
      this.mono = (function (v) { return v !== null && v !== 'false' && v !== '0'; })(this.getAttribute('mono'));
      this.speed = parseFloat(this.getAttribute('speed') || '1');
      this.holdMs = parseFloat(this.getAttribute('hold') || '3400');
      this.n = parseInt(this.getAttribute('count') || '280', 10);
      this.mRad = parseFloat(this.getAttribute('mouse-radius') || this.getAttribute('mouseradius') || '0.07');
      this.mForce = parseFloat(this.getAttribute('mouse-force') || this.getAttribute('mouseforce') || '0.045');
      this.wiggle = parseFloat(this.getAttribute('wiggle') || '1');
      this.total = F.length;
      this.cfg = this._readCfg();
      this.timing = this._readTiming();
      this.ui = this._readOverlay();
      this.gfx = this._readGraph();

      this.style.display = 'block'; this.style.position = 'relative';
      this.style.width = '100%'; this.style.height = '100%';
      const c = this.canvas = document.createElement('canvas');
      Object.assign(c.style, { display: 'block', width: '100%', height: '100%' });
      c.setAttribute('aria-hidden', 'true');
      this.appendChild(c);
      this.ctx = c.getContext('2d');

      this.locked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.stage = 0; this.next = 1; this.blend = 0; this.phase = 'hold';
      this.t0 = performance.now(); this.mouse = { x: -9, y: -9, on: false };

      this.p = Array.from({ length: this.n }, (_, i) => ({
        x: rnd(i, 3), y: rnd(i, 4), vx: 0, vy: 0, ax: 0, ay: 0, bx: 0, by: 0,
        pop: i % 2, hot: false, ph: rnd(i, 9) * 6.28
      }));
      if (this.hasAttribute('controls')) this._overlay();
      this._retarget(true);

      this.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        this.mouse = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, on: true };
      });
      this.addEventListener('pointerleave', () => { this.mouse.on = false; });

      this._fit(); this._ro = new ResizeObserver(() => this._fit()); this._ro.observe(this);
      this.visible = true;
      this._io = new IntersectionObserver(([e]) => {
        const vis = !!(e && e.isIntersecting);
        if (vis && !this.visible) this._fit();
        this.visible = vis;
      }, { threshold: 0 });
      this._io.observe(this);
      this._loop = this._loop.bind(this); this.last = performance.now();
      this.raf = requestAnimationFrame(this._loop);
    }
    static get observedAttributes() { return ['timing', 'speed', 'hold', 'mouse-radius', 'mouse-force', 'mouseradius', 'mouseforce', 'wiggle', 'mono']; }
    attributeChangedCallback(name, _old, v) {
      if (!this._built) return;
      if (name === 'timing') { this.cfg = this._readCfg(); this.timing = this._readTiming(); this.ui = this._readOverlay(); this._applyOverlayStyle(); }
      else if (name === 'speed') { this.speed = parseFloat(v) || 1; this.timing = this._readTiming(); }
      else if (name === 'hold') { this.holdMs = parseFloat(v) || 3400; this.timing = this._readTiming(); }
      else if (name === 'mouse-radius' || name === 'mouseradius') this.mRad = parseFloat(v) || 0;
      else if (name === 'mouse-force' || name === 'mouseforce') this.mForce = parseFloat(v) || 0;
      else if (name === 'wiggle') this.wiggle = Number.isFinite(parseFloat(v)) ? parseFloat(v) : 1;
      else if (name === 'mono') this.mono = v !== null && v !== 'false' && v !== '0';
    }
    disconnectedCallback() { cancelAnimationFrame(this.raf); this._ro && this._ro.disconnect(); this._io && this._io.disconnect(); }

    _overlay() {
      const dark = this.dark, mut = dark ? '#9A95B4' : '#767190', strong = dark ? '#F4F2FB' : '#2D2A45';
      const face = "'IRANSansX', system-ui, sans-serif";
      const top = document.createElement('div');
      Object.assign(top.style, {
        position: 'absolute', top: '0', left: '0', right: '0', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: '14px', padding: '16px 18px',
        font: '400 15px/1 ' + face, pointerEvents: 'none'
      });
      const live = document.createElement('div');
      Object.assign(live.style, { display: 'flex', alignItems: 'center', gap: '9px', flex: 'none' });
      const dot = document.createElement('span');
      Object.assign(dot.style, {
        width: '7px', height: '7px', flex: 'none', borderRadius: '50%', background: '#22C55E',
        boxShadow: '0 0 0 3px rgba(34,197,94,.16)'
      });
      this.readout = document.createElement('span'); this.readout.textContent = F[0].label;
      live.append(dot, this.readout);
      const flow = this.flowEl = document.createElement('span');
      top.append(live, flow);

      const bar = this.capBar = document.createElement('div');
      Object.assign(bar.style, {
        position: 'absolute', left: '0', right: '0', bottom: '0', display: 'flex',
        flexDirection: 'column', gap: '10px', padding: '0 18px 16px',
        font: '400 13px/1.45 ' + face, pointerEvents: 'none'
      });
      this.cap = document.createElement('div');
      Object.assign(this.cap.style, { textWrap: 'pretty' });

      const row = document.createElement('div');
      Object.assign(row.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px' });
      this.pager = document.createElement('div');
      Object.assign(this.pager.style, { display: 'flex', alignItems: 'center', gap: '5px', flex: '1 1 auto', minWidth: '0', pointerEvents: 'auto' });
      const right = document.createElement('div');
      Object.assign(right.style, { display: 'flex', alignItems: 'center', gap: '8px', flex: 'none', pointerEvents: 'auto' });
      const mk = (txt, fn, w) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', txt);
        Object.assign(b.style, {
          font: '500 11px/1 ' + face, letterSpacing: '.06em', height: '26px', minWidth: w || '26px',
          padding: w ? '0 12px' : '0', borderRadius: '999px', cursor: 'pointer',
          border: '1px solid ' + (dark ? 'rgba(226,222,240,.22)' : 'rgba(45,42,69,.16)'),
          background: dark ? 'rgba(244,242,251,.06)' : 'rgba(255,255,255,.7)',
          color: dark ? '#D6D1EC' : '#433F5C', transition: 'all 160ms cubic-bezier(.22,1,.36,1)'
        });
        b.onmouseenter = () => { b.style.borderColor = VIOLET; };
        b.onmouseleave = () => { b.style.borderColor = dark ? 'rgba(226,222,240,.22)' : 'rgba(45,42,69,.16)'; };
        b.onclick = fn; return b;
      };
      this.count = document.createElement('div');
      Object.assign(this.count.style, {
        font: '500 11px/1 ' + face, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: mut, marginInlineEnd: '4px'
      });
      const lock = this.lockBtn = mk('Lock', () => {
        this.locked = !this.locked;
        lock.textContent = this.locked ? 'Locked' : 'Lock';
        lock.style.background = this.locked ? 'rgba(139,92,246,.18)' : (dark ? 'rgba(244,242,251,.06)' : 'rgba(255,255,255,.7)');
        lock.style.color = this.locked ? (dark ? '#fff' : '#6D28D9') : (dark ? '#D6D1EC' : '#433F5C');
      }, '54px');
      right.append(this.count, mk('←', () => this._go(this.stage - 1)), mk('→', () => this._go(this.stage + 1)), lock);
      const cursor = null;
      row.append(this.pager, right);
      bar.append(this.cap, row);
      this.append(top, bar);

      this.ticks = [];
      for (let i = 0; i < this.total; i++) {
        const t = document.createElement('button');
        t.type = 'button'; t.title = F[i].label; t.setAttribute('aria-label', F[i].label);
        Object.assign(t.style, {
          position: 'relative', width: '14px', height: '3px', padding: '0', border: '0', cursor: 'pointer',
          borderRadius: '99px', background: dark ? 'rgba(226,222,240,.20)' : 'rgba(45,42,69,.14)',
          transition: 'width 240ms cubic-bezier(.22,1,.36,1), background 200ms ease'
        });
        const fill = document.createElement('span');
        Object.assign(fill.style, {
          position: 'absolute', inset: '0 auto 0 0', width: '0%', borderRadius: '99px',
          background: this.mono ? (dark ? '#D6D1EC' : '#433F5C') : HOT
        });
        t.append(fill); t.onclick = () => this._go(i);
        this.pager.append(t); this.ticks.push(fill);
      }
      this.cur = -1;
      this._applyOverlayStyle();
    }
    _paint(i, frac) {
      if (!this.ticks) return;
      if (i !== this.cur) {
        this.cur = i;
        this.ticks.forEach((fill, j) => {
          const el = fill.parentElement;
          el.style.width = j === i ? '30px' : '14px';
          el.style.background = j < i
            ? (this.dark ? 'rgba(226,222,240,.42)' : 'rgba(45,42,69,.32)')
            : (this.dark ? 'rgba(226,222,240,.20)' : 'rgba(45,42,69,.14)');
          if (j !== i) fill.style.width = '0%';
        });
        this.count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(this.total).padStart(2, '0');
        this.cap.textContent = this.timing.captions[i];
        this.readout.textContent = F[i].label;
      }
      this.ticks[i].style.width = (Math.max(0, Math.min(1, frac)) * 100) + '%';
    }
    /* Per-step timing comes from src/data/story-stage.json, serialized into the
       `timing` attribute at build time. Its values are wall-clock milliseconds
       and are NOT scaled by `speed` — `speed` now only tunes the particle
       spring in _step(). When the attribute is absent or malformed (the element
       used standalone), fall back to the old hold/speed attributes so nothing
       breaks. */
    _readCfg() {
      try { return JSON.parse(this.getAttribute('timing') || 'null') || {}; }
      catch (e) { console.warn('<story-stage>: the timing attribute is not valid JSON — falling back to defaults.'); return {}; }
    }
    /* Overlay styling, also from src/data/story-stage.json. Every field is
       optional: anything absent keeps the built-in value, so the JSON only has
       to carry what is actually being overridden. */
    _readOverlay() {
      const o = this.cfg.overlay || {}, L = o.label || {}, W = o.flow || {}, C = o.caption || {}, d = this.dark;
      const num = (v, dft) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : dft);
      const str = (v, dft) => (v === undefined || v === null || v === '' ? dft : String(v));
      const bool = (v, dft) => (v === undefined || v === null ? dft : v !== false);
      return {
        narrowBelowPx: num(o.narrowBelowPx, 470),
        label: {
          fontSize: num(L.fontSize, 15),
          fontSizeNarrow: num(L.fontSizeNarrow, 12.5),
          fontWeight: str(L.fontWeight, '800'),
          letterSpacing: str(L.letterSpacing, '0.1em'),
          letterSpacingNarrow: str(L.letterSpacingNarrow, '0.08em'),
          color: str(d ? L.colorDark : L.color, d ? '#F4F2FB' : '#2D2A45'),
          uppercase: bool(L.uppercase, true),
        },
        caption: {
          fontSize: num(C.fontSize, 15),
          fontSizeNarrow: num(C.fontSizeNarrow, 13),
          fontWeight: str(C.fontWeight, '400'),
          lineHeight: str(C.lineHeight, '1.45'),
          letterSpacing: str(C.letterSpacing, 'normal'),
          color: str(d ? C.colorDark : C.color, d ? '#F4F2FB' : '#2D2A45'),
        },
        flow: {
          text: str(W.text, 'Data → insight → decision → value'),
          fontSize: num(W.fontSize, 12.5),
          fontSizeNarrow: num(W.fontSizeNarrow, 11),
          fontWeight: str(W.fontWeight, '600'),
          letterSpacing: str(W.letterSpacing, '0.02em'),
          color: str(d ? W.colorDark : W.color, d ? '#B7B2CE' : '#5B5675'),
          hideWhenTight: bool(W.hideWhenTight, true),
        },
      };
    }
    /* Knowledge-graph rendering, from the `graph` block of the settings file.
       `linkBoost` widens the proximity cutoff on that formation only — its
       rings sit just outside the default radius, so a small boost is what turns
       a ring of arcs into a connected graph. */
    _readGraph() {
      const g = this.cfg.graph || {}, m = g.metaPaths || {};
      const num = (v, dft) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : dft);
      const bool = (v, dft) => (v === undefined || v === null ? dft : v !== false);
      const boost = Math.max(1, num(g.linkBoost, 1.55));
      return {
        linkBoost: boost,
        cellPx: LINK_PX * boost,
        meta: {
          on: bool(m.enabled, true),
          count: Math.max(0, Math.round(num(m.count, 2))),
          length: Math.max(2, Math.round(num(m.length, 9))),
          intervalMs: Math.max(400, num(m.intervalMs, 2600)),
          width: num(m.width, 1.5),
          rgb: rgb(m.color, this.mono ? (this.dark ? '214,209,236' : '67,63,92') : '217,64,126'),
          pulse: bool(m.pulse, true),
        },
      };
    }
    _readTiming() {
      const sp = parseFloat(this.getAttribute('speed') || '1') || 1;
      const t = {
        transitionMs: TRANS / sp,
        holds: new Array(this.total).fill(parseFloat(this.getAttribute('hold') || '3400') / sp),
        captions: F.map((f) => f.caption),
      };
      const cfg = this.cfg;
      if (!cfg) return t;
      const tr = parseFloat(cfg.transitionMs);
      if (Number.isFinite(tr) && tr > 0) t.transitionMs = tr;
      const steps = Array.isArray(cfg.steps) ? cfg.steps : [];
      if (steps.length && steps.length !== this.total) {
        console.warn('<story-stage>: timing has ' + steps.length + ' steps, expected ' + this.total + ' — extras ignored, gaps keep the default hold.');
      }
      for (let i = 0; i < this.total; i++) {
        const h = steps[i] && parseFloat(steps[i].holdMs);
        if (Number.isFinite(h) && h > 0) t.holds[i] = h;
        if (steps[i] && typeof steps[i].caption === 'string') t.captions[i] = steps[i].caption;
        if (steps[i] && steps[i].label && steps[i].label !== F[i].label) {
          console.warn('<story-stage>: timing step ' + i + ' is labelled "' + steps[i].label + '" but formation ' + i + ' is "' + F[i].label + '" — the JSON is out of order.');
        }
      }
      return t;
    }
    _go(i) {
      this.stage = ((i % this.total) + this.total) % this.total;
      this.next = (this.stage + 1) % this.total;
      this.blend = 0; this.phase = 'hold'; this.t0 = performance.now();
      this._retarget();
    }
    _retarget(init) {
      const a = F[this.stage], b = F[this.next];
      this.p.forEach((q, i) => {
        const A = a.pos(i, this.n, q.pop), B = b.pos(i, this.n, q.pop);
        q.ax = A[0]; q.ay = A[1]; q.bx = B[0]; q.by = B[1];
        q.hot = !!a.hot(i);
        if (init) { q.x = A[0]; q.y = A[1]; }
      });
      this.dispatchEvent(new CustomEvent('stagechange', { detail: { index: this.stage, label: a.label, caption: a.caption } }));
    }
    _fit() {
      const r = this.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
      this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
      this.canvas.width = this.w * d; this.canvas.height = this.h * d;
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
      this._fitOverlay();
    }
    /* Keep the top bar legible without letting it overrun a narrow stage: the
       label shrinks first, and the flow line drops out before either can wrap. */
    /* Everything from the settings file that is not width-dependent. Split out
       so editing the `timing` attribute in devtools re-skins the bar. */
    _applyOverlayStyle() {
      if (!this.readout || !this.cap) return;
      const ui = this.ui;
      Object.assign(this.readout.style, {
        whiteSpace: 'nowrap', fontWeight: ui.label.fontWeight, color: ui.label.color,
        textTransform: ui.label.uppercase ? 'uppercase' : 'none',
      });
      Object.assign(this.cap.style, {
        fontWeight: ui.caption.fontWeight, lineHeight: ui.caption.lineHeight,
        letterSpacing: ui.caption.letterSpacing, color: ui.caption.color,
      });
      this.flowEl.textContent = ui.flow.text;
      Object.assign(this.flowEl.style, {
        whiteSpace: 'nowrap', textTransform: 'none', flex: 'none',
        fontWeight: ui.flow.fontWeight, letterSpacing: ui.flow.letterSpacing, color: ui.flow.color,
      });
      this._fitOverlay();
    }
    _fitOverlay() {
      if (!this.readout || !this.cap) return;
      const ui = this.ui, narrow = this.w < ui.narrowBelowPx;
      this.readout.style.fontSize = (narrow ? ui.label.fontSizeNarrow : ui.label.fontSize) + 'px';
      this.readout.style.letterSpacing = narrow ? ui.label.letterSpacingNarrow : ui.label.letterSpacing;
      this.flowEl.style.fontSize = (narrow ? ui.flow.fontSizeNarrow : ui.flow.fontSize) + 'px';
      this.cap.style.fontSize = (narrow ? ui.caption.fontSizeNarrow : ui.caption.fontSize) + 'px';
      // Measure rather than guess a breakpoint: the label is the widest part
      // and its text changes every step, so the flow line is only shown when
      // it genuinely fits beside the longest current label.
      const bar = this.flowEl.parentNode, shown = this.readout.textContent;
      this.flowEl.style.display = '';
      if (!ui.flow.hideWhenTight) return;
      this.readout.textContent = WIDEST;
      const fits = bar.scrollWidth <= bar.clientWidth + 1;
      this.readout.textContent = shown;
      if (!fits) this.flowEl.style.display = 'none';
    }
    _loop(now) {
      this.raf = requestAnimationFrame(this._loop);
      const dt = Math.min(50, now - this.last); this.last = now;
      const box = this.getBoundingClientRect();
      if (box.width > 1 && (Math.abs(box.width - this.w) > 1 || Math.abs(box.height - this.h) > 1)) this._fit();
      if (box.width < 2 || box.height < 2) return;
      if (document.hidden || this.visible === false) return;
      const el = now - this.t0;
      const moveD = this.timing.transitionMs;
      if (this.phase === 'move') {
        this.blend = Math.min(1, el / moveD);
        if (this.blend >= 1) { this.stage = this.next; this.next = (this.stage + 1) % this.total; this.blend = 0; this.phase = 'hold'; this.t0 = now; this._retarget(); }
      } else if (!this.locked && el > this.timing.holds[this.stage]) {
        this.phase = 'move'; this.t0 = now; this.blend = 0;
      }
      const holdD = this.timing.holds[this.stage], span = holdD + moveD;
      const frac = this.phase === 'move'
        ? (holdD + Math.min(moveD, el)) / span
        : Math.min(holdD, el) / span;
      this._step(dt / 16.67, now); this._draw(now); this._paint(this.stage, frac);
    }
    _step(f, now) {
      const k = 0.055 * this.speed, damp = 0.86, mo = this.mouse, e = smooth(this.blend);
      const t = now / 1000, calm = (1 - e * 0.6) * (this.wiggle == null ? 1 : this.wiggle);
      for (const q of this.p) {
        const drift = 0.019 * calm;
        const dx0 = Math.sin(t * 0.72 + q.ph) * drift + Math.sin(t * 1.63 + q.ph * 2.3) * drift * 0.55 + Math.sin(t * 0.24 + q.ph * 3.7) * drift * 0.8;
        const dy0 = Math.cos(t * 0.61 + q.ph * 1.7) * drift + Math.cos(t * 1.41 + q.ph) * drift * 0.55 + Math.cos(t * 0.29 + q.ph * 2.9) * drift * 0.8;
        const swirl = Math.sin(t * 0.17 + q.ph * 0.4) * 0.011 * calm;
        const tx = q.ax + (q.bx - q.ax) * e + dx0 + swirl;
        const ty = q.ay + (q.by - q.ay) * e + dy0 - swirl * 0.6;
        q.vx += (tx - q.x) * k * f; q.vy += (ty - q.y) * k * f;
        if (mo.on) {
          const dx = q.x - mo.x, dy = (q.y - mo.y) * (this.h / this.w), d2 = dx * dx + dy * dy;
          const r = this.mRad;
          if (d2 < r * r && d2 > 1e-8) {
            const d = Math.sqrt(d2), s = (1 - d / r) * this.mForce;
            q.vx += (dx / d) * s * f; q.vy += (dy / d) * s * f;
          }
        }
        q.vx *= damp; q.vy *= damp; q.x += q.vx * f; q.y += q.vy * f;
      }
    }
    /* How strongly the knowledge-graph formation is on screen: 1 while it is
       held, falling to 0 as it morphs out (and rising as it morphs in), so the
       meta paths fade with the formation instead of popping. */
    _metaAmt(e) {
      const a = F[this.stage].graph ? 1 - e : 0, b = F[this.next].graph ? e : 0;
      return Math.max(a, b);
    }
    /* A meta path is a chain of relations — disease → gene → pathway → drug.
       Walk the adjacency the link pass just built, preferring unvisited
       neighbours so the walk travels instead of oscillating between two nodes. */
    _walk(adj, len) {
      const keys = [...adj.keys()];
      if (!keys.length) return null;
      let node = keys[(Math.random() * keys.length) | 0];
      const path = [node], seen = new Set(path);
      let hx = null, hy = null;
      while (path.length < len) {
        const nb = adj.get(node);
        if (!nb) break;
        const open = nb.filter((x) => !seen.has(x));
        if (!open.length) break;
        let pick;
        if (hx === null) {
          pick = open[(Math.random() * open.length) | 0];
        } else {
          // Score each candidate on how well it continues the current heading,
          // then choose at random among the near-best — directed, not rigid.
          let best = -2, tied = [];
          for (const c of open) {
            const dx = c.x - node.x, dy = c.y - node.y, mg = Math.hypot(dx, dy) || 1;
            const dot = (dx / mg) * hx + (dy / mg) * hy;
            if (dot > best + 1e-6) { best = dot; tied = [c]; }
            else if (dot > best - 0.18) tied.push(c);
          }
          pick = tied[(Math.random() * tied.length) | 0];
        }
        const dx = pick.x - node.x, dy = pick.y - node.y, mg = Math.hypot(dx, dy) || 1;
        hx = dx / mg; hy = dy / mg;
        node = pick; seen.add(node); path.push(node);
      }
      return path.length >= 3 ? path : null;
    }
    _drawMeta(ctx, X, Y, adj, amt, now, R) {
      const m = this.gfx.meta;
      const stretched = (pth) => {
        for (let i = 1; i < pth.length; i++) {
          if (Math.hypot(X(pth[i]) - X(pth[i - 1]), Y(pth[i]) - Y(pth[i - 1])) > R * 1.5) return true;
        }
        return false;
      };
      const stale = !this._meta || now - this._meta.born > m.intervalMs
        || this._meta.paths.some(stretched);
      if (stale) {
        const paths = [];
        for (let i = 0; i < m.count; i++) {
          const pth = this._walk(adj, m.length);
          if (pth) paths.push(pth);
        }
        this._meta = { paths, born: now };
      }
      const paths = this._meta.paths;
      if (!paths.length) return;
      // Fade each set in and out over its own lifetime so paths cross-dissolve.
      const age = Math.min(1, (now - this._meta.born) / m.intervalMs);
      const ramp = 0.16;
      const a = amt * (age < ramp ? age / ramp : age > 1 - ramp ? (1 - age) / ramp : 1);
      if (a <= 0.01) return;
      const prevCap = ctx.lineCap, prevJoin = ctx.lineJoin;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const pth of paths) {
        ctx.beginPath();
        ctx.moveTo(X(pth[0]), Y(pth[0]));
        for (let i = 1; i < pth.length; i++) ctx.lineTo(X(pth[i]), Y(pth[i]));
        ctx.strokeStyle = 'rgba(' + m.rgb + ',' + (0.10 * a).toFixed(3) + ')';
        ctx.lineWidth = m.width * 3.4; ctx.stroke();
        ctx.strokeStyle = 'rgba(' + m.rgb + ',' + (0.85 * a).toFixed(3) + ')';
        ctx.lineWidth = m.width; ctx.stroke();
        for (const q of pth) {
          ctx.beginPath(); ctx.arc(X(q), Y(q), m.width * 1.6, 0, 6.284);
          ctx.fillStyle = 'rgba(' + m.rgb + ',' + a.toFixed(3) + ')'; ctx.fill();
        }
        if (m.pulse) this._pulse(ctx, X, Y, pth, a, now, m);
      }
      ctx.lineCap = prevCap; ctx.lineJoin = prevJoin; ctx.lineWidth = 0.7;
    }
    /* A dot running the length of the path — the relation being traversed. */
    _pulse(ctx, X, Y, pth, a, now, m) {
      let total = 0;
      const seg = [];
      for (let i = 1; i < pth.length; i++) {
        const d = Math.hypot(X(pth[i]) - X(pth[i - 1]), Y(pth[i]) - Y(pth[i - 1]));
        seg.push(d); total += d;
      }
      if (total < 1) return;
      let at = ((now % m.intervalMs) / m.intervalMs) * total, i = 0;
      while (i < seg.length && at > seg[i]) { at -= seg[i]; i++; }
      if (i >= seg.length) return;
      const t = seg[i] ? at / seg[i] : 0;
      const px = X(pth[i]) + (X(pth[i + 1]) - X(pth[i])) * t;
      const py = Y(pth[i]) + (Y(pth[i + 1]) - Y(pth[i])) * t;
      ctx.beginPath(); ctx.arc(px, py, m.width * 3.2, 0, 6.284);
      ctx.fillStyle = 'rgba(' + m.rgb + ',' + (0.2 * a).toFixed(3) + ')'; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, m.width * 1.35, 0, 6.284);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.9 * a).toFixed(3) + ')'; ctx.fill();
    }
    _draw(now) {
      const ctx = this.ctx, w = this.w, h = this.h, padX = 26;
      const padTop = 40, padBot = (this.capBar ? this.capBar.getBoundingClientRect().height : 20) + 14;
      ctx.clearRect(0, 0, w, h);
      const X = q => padX + q.x * (w - padX * 2), Y = q => padTop + q.y * Math.max(40, h - padTop - padBot);
      /* The link radius is a property of the formation, blended across the
         morph so the graph densifies as it forms rather than snapping. The
         hash cell stays at the widest radius any formation asks for, so the
         3x2 neighbour scan below never misses a pair. */
      const eL = smooth(this.blend);
      const boost = (f) => (f.graph ? this.gfx.linkBoost : 1);
      const R = LINK_PX * (boost(F[this.stage]) * (1 - eL) + boost(F[this.next]) * eL);
      const cell = this.gfx.cellPx, grid = new Map();
      for (const q of this.p) {
        const key = ((X(q) / cell) | 0) + ':' + ((Y(q) / cell) | 0);
        let arr = grid.get(key); if (!arr) { arr = []; grid.set(key, arr); } arr.push(q);
      }
      ctx.lineWidth = 0.7;
      const base = this.mono ? (this.dark ? '214,209,236' : '67,63,92') : (this.dark ? '139,92,246' : '109,40,217');
      const metaAmt = this.gfx.meta.on && this.gfx.meta.count ? this._metaAmt(eL) : 0;
      const adj = metaAmt > 0.01 ? new Map() : null;
      const link = (a, b) => {
        let l = adj.get(a); if (!l) { l = []; adj.set(a, l); } l.push(b);
      };
      grid.forEach((arr, key) => {
        const parts = key.split(':'), cx = +parts[0], cy = +parts[1];
        for (let ox = 0; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          if (ox === 0 && oy < 0) continue;
          const o = grid.get((cx + ox) + ':' + (cy + oy)); if (!o) continue;
          for (const a of arr) for (const b of o) {
            if (a === b) continue;
            const d = Math.hypot(X(a) - X(b), Y(a) - Y(b));
            if (d < R) {
              ctx.strokeStyle = 'rgba(' + base + ',' + (0.3 * (1 - d / R)).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke();
              if (adj) { link(a, b); link(b, a); }
            }
          }
        }
      });

      for (const q of this.p) {
        const col = this.mono ? (this.dark ? '#C2BDD6' : '#5B5675') : (q.hot ? HOT : q.pop ? ORANGE : VIOLET);
        const pulse = 0.85 + Math.sin(now / 900 + q.ph) * 0.15, r = (q.hot ? 2.6 : 1.7) * pulse;
        if (q.hot) {
          ctx.beginPath(); ctx.arc(X(q), Y(q), r * 3.4, 0, 6.284);
          ctx.fillStyle = this.mono ? 'rgba(150,145,180,0.10)' : 'rgba(217,64,126,0.14)'; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(X(q), Y(q), r, 0, 6.284); ctx.fillStyle = col; ctx.fill();
      }
      if (adj) this._drawMeta(ctx, X, Y, adj, metaAmt, now, R);
    }
  }
  if (!window.customElements.get('story-stage')) customElements.define('story-stage', StoryStage);
})();
