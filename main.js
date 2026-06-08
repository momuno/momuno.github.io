// ── MOLLIE E. MUÑOZ — SHARED JS ──
// Loaded by all pages. Each page has its own small init block below.

// ── CHARCOAL CURSOR ──
(function() {
  const trailCanvas = document.getElementById('charcoal-cursor');
  if (!trailCanvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;

  // ── Trail canvas (existing fading trail) ──
  const ctx = trailCanvas.getContext('2d');
  ctx.globalCompositeOperation = 'multiply';
  const dpr = window.devicePixelRatio || 1;

  const resize = () => {
    trailCanvas.width  = window.innerWidth  * dpr;
    trailCanvas.height = window.innerHeight * dpr;
    trailCanvas.style.width  = window.innerWidth  + 'px';
    trailCanvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
  };
  resize();
  window.addEventListener('resize', resize);

  const points = [];
  window.__trailPoints = points;
  let last = null;
  let mouse = { x: -100, y: -100 };

  window.addEventListener('mousemove', (e) => {
    mouse = { x: e.clientX, y: e.clientY };
    const now = performance.now();
    let w = 1.2;
    if (last) {
      const dt = Math.max(1, now - last.t);
      const d  = Math.hypot(e.clientX - last.x, e.clientY - last.y);
      w = Math.max(0.4, Math.min(2.4, 2.4 - (d/dt) * 1.6));
    }
    // Offset trail to start from the tip of the stick
    const angle = -Math.PI / 5;
    const len = 20;
    const tipX = e.clientX + Math.sin(angle) * len * 0.5;
    const tipY = e.clientY - Math.cos(angle) * len * 0.5;
    if (!window.__crosshairActive) points.push({ x: tipX, y: tipY, w, a: 0.32 });
    last = { x: e.clientX, y: e.clientY, t: now };
  });

  const tick = () => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    ctx.globalCompositeOperation = 'multiply';

    // Draw fading trail
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1], p1 = points[i];
      ctx.strokeStyle = `rgba(40,36,28,${p1.a})`;
      ctx.lineWidth = p1.w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      p1.a *= 0.955;
    }
    while (points.length && points[0].a < 0.01) points.shift();

    // Draw charcoal stick at current mouse position
    if (!window.__crosshairActive) {
      drawCharcoalStick(ctx, mouse.x, mouse.y);
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // ── Charcoal stick shape ──
  function drawCharcoalStick(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // Angle — held like a piece of charcoal, ~35 degrees
    const angle = -Math.PI / 5;
    ctx.rotate(angle);

    const len  = 20;
    const wide = 3;

    // Worn charcoal — wider flat end at top, tapers unevenly to a worn tip at bottom
    // Not symmetrical, not sharp — like a stick that's been used a while
    const grad = ctx.createLinearGradient(-wide, -len * 0.5, wide * 0.5, len * 0.5);
    grad.addColorStop(0,   'rgba(72,65,55,0.85)');
    grad.addColorStop(0.3, 'rgba(42,37,30,0.92)');
    grad.addColorStop(0.7, 'rgba(28,24,18,0.96)');
    grad.addColorStop(1,   'rgba(18,15,10,0.99)');

    ctx.beginPath();
    // Flat broken bottom — the end you hold
    ctx.moveTo(-wide * 0.6,  len * 0.5);
    ctx.lineTo( wide * 0.2,  len * 0.3);
    // Right side
    ctx.quadraticCurveTo( wide * 0.2, -len * 0.0,  wide * 0.3, -len * 0.3);
    ctx.lineTo( -wide * 0.5, -len * 0.5);
    // Left side
    ctx.quadraticCurveTo(-wide * 0.4, -len * 0.8, -wide * 0.8,  len * 0.2);
    ctx.lineTo(-wide * 0.8,  len * 0.4);
    ctx.closePath();

    ctx.fillStyle = grad;
    ctx.fill();

    // Tip highlight — chalky worn end at top
    ctx.beginPath();
    ctx.moveTo(-wide * 0.2, -len * 0.25);
    ctx.quadraticCurveTo( wide * 0.3, -len * 0.35,  wide * 0.1, -len * 0.5);
    ctx.lineTo(-wide * 0.2, -len * 0.45);
    ctx.closePath();
    ctx.fillStyle = 'rgba(95,85,70,0.55)';
    ctx.fill();

    // Powdery dust smudge above tip
    ctx.beginPath();
    ctx.ellipse(0, -len * 0.58, wide * 0.35, wide * 0.12, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,36,28,0.18)';
    ctx.fill();

    // A couple of irregular grain/fracture lines across the body
    ctx.beginPath();
    ctx.moveTo(-wide * 0.7, -len * 0.15);
    ctx.lineTo( wide * 0.5, -len * 0.1);
    ctx.strokeStyle = 'rgba(15,12,8,0.2)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-wide * 0.5,  len * 0.12);
    ctx.lineTo( wide * 0.3,  len * 0.18);
    ctx.strokeStyle = 'rgba(15,12,8,0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }
})();

// ── INK MARK ENGINE ──
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSweep(canvas, seed, style) {
  if (!canvas) return;
  const w = canvas.parentElement ? canvas.parentElement.offsetWidth || 800 : 800;

  // style controls the character of the line
  // 'sparse'  — like the eyebrow: light, searching, long, few hairs
  // 'medium'  — moderate weight, gentle waver
  // 'heavy'   — slower, more pressure, darker
  // 'broken'  — frequent dry gaps, lighter
  // 'double'  — two passes at slightly different y
  const cfg = {
    sparse: { h: 28,  steps: 130, lwBase: 0.15, lwPeak: 0.55, aBase: 0.06, aPeak: 0.18, waver: 2,  hairChance: 0.4  },
    hairline:{ h: 32,  steps: 140, lwBase: 0.2,  lwPeak: 0.65, aBase: 0.07, aPeak: 0.2,  waver: 3,  hairChance: 0.35 },
    medium: { h: 48, steps: 100, lwBase: 0.4, lwPeak: 1.3,  aBase: 0.14, aPeak: 0.38, waver: 6,  hairChance: 0.18 },
    heavy:  { h: 68,  steps: 75,  lwBase: 0.8,  lwPeak: 2.8,  aBase: 0.22, aPeak: 0.58, waver: 4,  hairChance: 0.06 },
    broken: { h: 40, steps: 110, lwBase: 0.3, lwPeak: 0.8,  aBase: 0.08, aPeak: 0.22, waver: 8,  hairChance: 0.35 },
    double: { h: 52, steps: 90,  lwBase: 0.35, lwPeak: 1.0, aBase: 0.12, aPeak: 0.3,  waver: 5,  hairChance: 0.15 },
  }[style] || { h: 48, steps: 100, lwBase: 0.4, lwPeak: 1.3, aBase: 0.14, aPeak: 0.38, waver: 6, hairChance: 0.18 };

  const h = cfg.h;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const rand = mulberry32(seed * 9301 + 49297);
  const segs = [];

  const makeLine = (offsetY) => {
    const baseY = h / 2 + offsetY;
    let prevX = 0, prevY = baseY + (rand()-0.5)*3;
    for (let i = 1; i <= cfg.steps; i++) {
      const t = i / cfg.steps;
      const taper = Math.sin(Math.PI * t);
      const x = w * t + (rand()-0.5)*1.5;
      const y = baseY + (rand()-0.5)*cfg.waver + Math.sin(t*5+seed)*1.5;
      const lw = cfg.lwBase + taper*cfg.lwPeak + rand()*0.3;
      const a  = cfg.aBase  + taper*cfg.aPeak  + rand()*0.06;
      segs.push({ x0: prevX, y0: prevY, x1: x, y1: y, lw, a });
      // dry hairs
      if (rand() < cfg.hairChance) {
        segs.push({ x0: prevX, y0: prevY+(rand()-0.5)*5,
                    x1: x,    y1: y    +(rand()-0.5)*5,
                    lw: 0.25+rand()*0.25, a: 0.05+rand()*0.08 });
      }
      prevX = x; prevY = y;
    }
  };

  makeLine(0);
  if (style === 'double') makeLine(h * 0.18); // second pass slightly below

  const stroke = (s) => {
    ctx.strokeStyle = `rgba(40,36,28,${s.a})`;
    ctx.lineWidth = s.lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x1, s.y1);
    ctx.stroke();
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { segs.forEach(stroke); return; }

  let i = 0;
  const draw = () => {
    const per = Math.max(1, Math.floor(segs.length / 70));
    for (let k = 0; k < per && i < segs.length; k++, i++) stroke(segs[i]);
    if (i < segs.length) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

function drawFlourish(canvas) {
  if (!canvas) return;
  const maxW = 420, maxH = 60;
  const w = Math.min(maxW, window.innerWidth * 0.55);
  const h = Math.round(w * (maxH / maxW));
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const rand = mulberry32(42 * 9301 + 49297);
  const segs = [];
  const steps = 70;
  let prevX = 6, prevY = h * 0.75;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = 6 + (w - 12) * t;
    const y = h*0.75
      - Math.sin(t * Math.PI * 0.85) * h * 0.5
      + (t > 0.85 ? (t - 0.85) * h * 1.8 : 0)
      + (rand()-0.5) * 1.4;
    const taper = Math.sin(Math.PI * t);
    segs.push({ x0: prevX, y0: prevY, x1: x, y1: y,
      lw: 0.5 + taper * 1.7, a: 0.25 + taper * 0.45 });
    prevX = x; prevY = y;
  }

  let i = 0;
  const stroke = (s) => {
    ctx.strokeStyle = `rgba(40,36,28,${s.a})`;
    ctx.lineWidth = s.lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x1, s.y1);
    ctx.stroke();
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { segs.forEach(stroke); return; }

  const draw = () => {
    const per = Math.max(1, Math.floor(segs.length / 60));
    for (let k = 0; k < per && i < segs.length; k++, i++) stroke(segs[i]);
    if (i < segs.length) requestAnimationFrame(draw);
  };

  // delay to match opening animation
  setTimeout(() => requestAnimationFrame(draw), 1800);
}

// ── STAMP MARKS ──
function drawStamp(canvas, seed) {
  if (!canvas) return;
  const w = 78, h = 78;
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width  = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const rand = mulberry32(seed * 9301 + 49297);
  const segs = [];
  const cx = w / 2, cy = h / 2;
  const passes = 5 + Math.floor(rand() * 4);

  for (let p = 0; p < passes; p++) {
    const angle = rand() * Math.PI;
    const len = h * (0.3 + rand() * 0.45);
    const ox = (rand() - 0.5) * w * 0.3;
    const oy = (rand() - 0.5) * h * 0.3;
    const steps = 18;
    let prevX = cx + ox - Math.cos(angle) * len * 0.5;
    let prevY = cy + oy - Math.sin(angle) * len * 0.5;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = cx + ox - Math.cos(angle)*len*0.5 + Math.cos(angle)*len*t + (rand()-0.5)*1.2;
      const y = cy + oy - Math.sin(angle)*len*0.5 + Math.sin(angle)*len*t + (rand()-0.5)*1.2;
      const taper = Math.sin(Math.PI * t);
      segs.push({ x0: prevX, y0: prevY, x1: x, y1: y,
        lw: 0.4 + taper * 1.1, a: 0.1 + taper * 0.28 });
      prevX = x; prevY = y;
    }
  }

  const stroke = (s) => {
    ctx.strokeStyle = `rgba(40,36,28,${s.a})`;
    ctx.lineWidth = s.lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x1, s.y1);
    ctx.stroke();
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { segs.forEach(stroke); return; }

  let i = 0;
  const draw = () => {
    const per = Math.max(1, Math.floor(segs.length / 40));
    for (let k = 0; k < per && i < segs.length; k++, i++) stroke(segs[i]);
    if (i < segs.length) requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}


// ── INDEX PAGE INIT ──
document.addEventListener('DOMContentLoaded', function() {

// Init all stamp marks
document.querySelectorAll('.stamp-canvas').forEach(canvas => {
  const seed = parseInt(canvas.dataset.seed || '1');
  drawStamp(canvas, seed);
});

drawFlourish(document.getElementById('flourish-canvas'));
drawFlourish(document.getElementById('statement-flourish'));

// Each sweep gets a genuinely different character
const sweepConfig = [
  { id: 'sweep-intro', seed: 2,  style: 'hairline' },
  { id: 'sweep-info',  seed: 7,  style: 'hairline' },
];
sweepConfig.forEach(({ id, seed, style }) => {
  drawSweep(document.getElementById(id), seed, style);
});

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
reveals.forEach(el => observer.observe(el));

// ── LIGHTBOX ──
(function() {
  const overlay  = document.getElementById('lightbox');
  const lightImg = document.getElementById('lightbox-img');
  if (!overlay || !lightImg) return;
 
  window.__crosshairActive = false;

  // ── Crosshair canvas (separate from charcoal trail, uses mix-blend-mode: difference) ──
  const xhCanvas = document.getElementById('crosshair-cursor');
  let xhCtx = null;
  if (xhCanvas) {
    xhCtx = xhCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const resizeXh = () => {
      xhCanvas.width  = window.innerWidth  * dpr;
      xhCanvas.height = window.innerHeight * dpr;
      xhCanvas.style.width  = window.innerWidth  + 'px';
      xhCanvas.style.height = window.innerHeight + 'px';
      xhCtx.scale(dpr, dpr);
    };
    resizeXh();
    window.addEventListener('resize', resizeXh);
  }

  function drawCrosshair(x, y) {
    if (!xhCtx) return;
    xhCtx.clearRect(0, 0, xhCanvas.width, xhCanvas.height);
    xhCtx.save();
    xhCtx.strokeStyle = 'white';
    xhCtx.lineCap = 'round';
    xhCtx.lineWidth = 1.5;

    const outer = 14; // length of each arm
    const gap   = 4;  // gap around center

    xhCtx.beginPath();
    // horizontal
    xhCtx.moveTo(x - outer, y); xhCtx.lineTo(x - gap, y);
    xhCtx.moveTo(x + gap,   y); xhCtx.lineTo(x + outer, y);
    // vertical
    xhCtx.moveTo(x, y - outer); xhCtx.lineTo(x, y - gap);
    xhCtx.moveTo(x, y + gap);   xhCtx.lineTo(x, y + outer);
    xhCtx.stroke();

    xhCtx.restore();
  }

  function clearCrosshair() {
    if (!xhCtx) return;
    xhCtx.clearRect(0, 0, xhCanvas.width, xhCanvas.height);
  }

  document.querySelectorAll('img.gallery-lightbox').forEach(img => {
    img.addEventListener('mouseenter', () => {
      window.__crosshairActive = true;
      if (window.__trailPoints) window.__trailPoints.length = 0;
    });
    img.addEventListener('mouseleave', () => {
      window.__crosshairActive = false;
      clearCrosshair();
    });
    img.addEventListener('mousemove', (e) => {
      drawCrosshair(e.clientX, e.clientY);
    });
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      window.__crosshairActive = false;
      lightImg.src = img.src;
      lightImg.alt = img.alt;
      lightImg.style.maxWidth = img.dataset.lightboxMaxwidth || '90vw';
      overlay.classList.add('active');
    });
  });
  
  overlay.addEventListener('click', () => overlay.classList.remove('active'));
  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') overlay.classList.remove('active');
  });
})();

// Tap to toggle overlay on touch devices
if (window.matchMedia('(hover: none)').matches) {
  document.querySelectorAll('.img-overlay-wrap').forEach(wrap => {
    wrap.addEventListener('click', () => {
      const overlay = wrap.querySelector('.img-overlay');
      const isVisible = overlay.style.opacity === '1';
      overlay.style.opacity = isVisible ? '0' : '1';
      wrap.querySelector('img').style.opacity = isVisible ? '1' : '0.1';
    });
  });
}

// ── MOBILE FULL-SCREEN NAV OVERLAY ──
(function() {
  const hamburger = document.querySelector('.nav-hamburger');
  const overlay   = document.querySelector('.nav-overlay');
  const closeBtn  = document.querySelector('.nav-overlay-close');
  if (!hamburger || !overlay) return;

  function openMenu() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);

  // Close on any nav link tap
  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });
})();

}); // end DOMContentLoaded