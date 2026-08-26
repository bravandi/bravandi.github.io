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
    { label: 'KNOWLEDGE GRAPH', caption: 'Relationships become the asset, not the rows.',
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

  class StoryStage extends HTMLElement {
    connectedCallback() {
      if (this._built) return; this._built = true;
      this.dark = this.getAttribute('theme') === 'dark';
      this.mono = this.hasAttribute('mono');
      this.speed = parseFloat(this.getAttribute('speed') || '1');
      this.holdMs = parseFloat(this.getAttribute('hold') || '3400');
      this.n = parseInt(this.getAttribute('count') || '280', 10);
      this.total = F.length;

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
      this._io = new IntersectionObserver(([e]) => { this.visible = !!(e && e.isIntersecting); }, { threshold: 0 });
      this._io.observe(this);
      this._loop = this._loop.bind(this); this.last = performance.now();
      this.raf = requestAnimationFrame(this._loop);
    }
    disconnectedCallback() { cancelAnimationFrame(this.raf); this._ro && this._ro.disconnect(); this._io && this._io.disconnect(); }

    _overlay() {
      const dark = this.dark, mut = dark ? '#9A95B4' : '#767190', strong = dark ? '#F4F2FB' : '#2D2A45';
      const face = "'IRANSansX', 'Segoe UI', Tahoma, system-ui, sans-serif";
      const top = document.createElement('div');
      Object.assign(top.style, {
        position: 'absolute', top: '0', left: '0', right: '0', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '14px 18px',
        font: '600 10.5px/1 ' + face, letterSpacing: '.16em', textTransform: 'uppercase',
        color: mut, pointerEvents: 'none'
      });
      const live = document.createElement('div');
      Object.assign(live.style, { display: 'flex', alignItems: 'center', gap: '8px' });
      const dot = document.createElement('span');
      Object.assign(dot.style, { width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' });
      this.readout = document.createElement('span'); this.readout.textContent = F[0].label;
      live.append(dot, this.readout);
      const flow = document.createElement('span');
      flow.textContent = 'Data → insight → decision → value';
      Object.assign(flow.style, { textTransform: 'none', letterSpacing: '.06em', fontWeight: '500', whiteSpace: 'nowrap' });
      top.append(live, flow);

      const bar = this.capBar = document.createElement('div');
      Object.assign(bar.style, {
        position: 'absolute', left: '0', right: '0', bottom: '0', display: 'flex',
        flexDirection: 'column', gap: '10px', padding: '0 18px 16px',
        font: '400 13px/1.45 ' + face, pointerEvents: 'none'
      });
      this.cap = document.createElement('div');
      Object.assign(this.cap.style, { color: strong, textWrap: 'pretty' });

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
        this.cap.textContent = F[i].caption;
        this.readout.textContent = F[i].label;
      }
      this.ticks[i].style.width = (Math.max(0, Math.min(1, frac)) * 100) + '%';
    }
    _go(i) {
      this.stage = ((i % this.total) + this.total) % this.total;
      this.next = (this.stage + 1) % this.total;
      this.blend = 0; this.phase = 'move'; this.t0 = performance.now();
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
    }
    _loop(now) {
      this.raf = requestAnimationFrame(this._loop);
      const dt = Math.min(50, now - this.last); this.last = now;
      if (!this.visible || document.hidden) return;
      const el = now - this.t0;
      if (this.phase === 'move') {
        this.blend = Math.min(1, el / (TRANS / this.speed));
        if (this.blend >= 1) { this.stage = this.next; this.next = (this.stage + 1) % this.total; this.blend = 0; this.phase = 'hold'; this.t0 = now; this._retarget(); }
      } else if (!this.locked && el > this.holdMs / this.speed) {
        this.phase = 'move'; this.t0 = now; this.blend = 0;
      }
      const frac = this.phase === 'move' ? this.blend : Math.min(1, el / (this.holdMs / this.speed));
      this._step(dt / 16.67); this._draw(now); this._paint(this.stage, frac);
    }
    _step(f) {
      const k = 0.055 * this.speed, damp = 0.86, mo = this.mouse, e = smooth(this.blend);
      for (const q of this.p) {
        const tx = q.ax + (q.bx - q.ax) * e, ty = q.ay + (q.by - q.ay) * e;
        q.vx += (tx - q.x) * k * f; q.vy += (ty - q.y) * k * f;
        if (mo.on) {
          const dx = q.x - mo.x, dy = (q.y - mo.y) * (this.h / this.w), d2 = dx * dx + dy * dy;
          if (d2 < 0.02 && d2 > 1e-6) { const g = (0.02 - d2) * 1.6 / Math.sqrt(d2); q.vx += dx * g * f; q.vy += dy * g * f; }
        }
        q.vx *= damp; q.vy *= damp; q.x += q.vx * f; q.y += q.vy * f;
      }
    }
    _draw(now) {
      const ctx = this.ctx, w = this.w, h = this.h, padX = 26;
      const padTop = 40, padBot = (this.capBar ? this.capBar.getBoundingClientRect().height : 20) + 14;
      ctx.clearRect(0, 0, w, h);
      // Idle wiggle: a small pixel-space jitter, independent of the spring
      // that settles particles onto their formation target, so the stage
      // stays visibly alive through the multi-second hold between formations
      // instead of freezing solid once particles arrive.
      const jt = now / 1000;
      const jx = q => Math.sin(jt * 1.6 + q.ph) * 9, jy = q => Math.cos(jt * 1.2 + q.ph * 1.4) * 9;
      const X = q => padX + q.x * (w - padX * 2) + jx(q), Y = q => padTop + q.y * Math.max(40, h - padTop - padBot) + jy(q);
      const cell = 46, grid = new Map();
      for (const q of this.p) {
        const key = ((X(q) / cell) | 0) + ':' + ((Y(q) / cell) | 0);
        let arr = grid.get(key); if (!arr) { arr = []; grid.set(key, arr); } arr.push(q);
      }
      ctx.lineWidth = 0.7;
      const base = this.mono ? (this.dark ? '214,209,236' : '67,63,92') : (this.dark ? '139,92,246' : '109,40,217');
      grid.forEach((arr, key) => {
        const parts = key.split(':'), cx = +parts[0], cy = +parts[1];
        for (let ox = 0; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          if (ox === 0 && oy < 0) continue;
          const o = grid.get((cx + ox) + ':' + (cy + oy)); if (!o) continue;
          for (const a of arr) for (const b of o) {
            if (a === b) continue;
            const d = Math.hypot(X(a) - X(b), Y(a) - Y(b));
            if (d < cell) {
              ctx.strokeStyle = 'rgba(' + base + ',' + (0.3 * (1 - d / cell)).toFixed(3) + ')';
              ctx.beginPath(); ctx.moveTo(X(a), Y(a)); ctx.lineTo(X(b), Y(b)); ctx.stroke();
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
    }
  }
  if (!window.customElements.get('story-stage')) customElements.define('story-stage', StoryStage);
})();
