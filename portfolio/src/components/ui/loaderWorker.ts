/**
 * Worker vẽ hiệu ứng hạt của màn hình loading trên OffscreenCanvas (luồng riêng).
 * Luồng chính có bận dựng trang chủ (React mount, khởi tạo WebGL, dựng chữ 3D) thì hạt vẫn chạy mượt.
 *
 * Tin nhắn nhận:  init {canvas?, w, h, dpr, cx, cy, psize, pts}   (pts: Float32Array [x,y, x,y, ...] — điểm của chữ TYPHAT.DEV)
 *                 progress {p} · mouse {x, y} · morph {targets}    (targets: Float32Array [x,y,line, ...] — điểm của tên ở hero)
 *                 fade {ms} · burst
 * Tin nhắn gửi:   morphDone
 */

type Ctx = OffscreenCanvasRenderingContext2D;
interface WorkerScope {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage(m: unknown): void;
  requestAnimationFrame(cb: (t: number) => void): number;
}
const scope = self as unknown as WorkerScope;

// ── bảng màu dựng sẵn ──────────────────────────────────────────────────────
const BUCKETS = 14, STEPS = 6, ALPHA_LEVELS = 6;
const hueOf = (b: number) => 115 + (b / (BUCKETS - 1)) * 215;          // xanh lá → xanh lơ → xanh dương → hồng
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  const f = (n: number) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
const PAL: [number, number, number][] = [[245, 245, 245], [57, 255, 20], [245, 245, 245]];   // trắng / xanh neon / trắng
const RAINBOW = Array.from({ length: BUCKETS }, (_, b) => { const [r, g, bl] = hslToRgb(hueOf(b), 1, 0.6); return `rgb(${r},${g},${bl})`; });
const MORPH_COLOR: string[] = [];
for (let b = 0; b < BUCKETS; b++) {
  const [r0, g0, b0] = hslToRgb(hueOf(b), 1, 0.6);
  for (let st = 0; st <= STEPS; st++) for (let line = 0; line < 3; line++) {
    const k = st / STEPS, [r1, g1, b1] = PAL[line];
    MORPH_COLOR.push(`rgb(${Math.round(r0 + (r1 - r0) * k)},${Math.round(g0 + (g1 - g0) * k)},${Math.round(b0 + (b1 - b0) * k)})`);
  }
}
const BIN_COUNT = BUCKETS * (STEPS + 1) * 3;
const bins: number[][] = Array.from({ length: BIN_COUNT }, () => []);
const used: number[] = [];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const MORPH_DUR = 1.25;

// ── trạng thái ─────────────────────────────────────────────────────────────
let canvas: OffscreenCanvas | null = null, ctx: Ctx | null = null;
let w = 0, h = 0, cx = 0, cy = 0, psize = 2.4, N = 0;
let X = new Float32Array(0), Y = X, TX = X, TY = X, ANG = X, RAD = X, SPD = X, DELAY = X, VX = X, VY = X, SEED = X;
let SX = X, SY = X, MX = X, MY = X, MD = X, CURVE = X;
let BUCKET = new Uint8Array(0), LINE = new Uint8Array(0);
let prog = 0, mode = 0, modeT = 0, fadeMs = 600, t = 0, last = 0, running = false, morphSignaled = false;
const mouse = { x: -9999, y: -9999 };

function init(d: { w: number; h: number; dpr: number; cx: number; cy: number; psize: number; pts: Float32Array }) {
  if (!canvas) return;
  ctx = canvas.getContext("2d") as Ctx;
  w = d.w; h = d.h; cx = d.cx; cy = d.cy; psize = d.psize;
  canvas.width = Math.round(w * d.dpr); canvas.height = Math.round(h * d.dpr);
  ctx.setTransform(d.dpr, 0, 0, d.dpr, 0, 0);

  N = d.pts.length / 2;
  const F = () => new Float32Array(N);
  X = F(); Y = F(); TX = F(); TY = F(); ANG = F(); RAD = F(); SPD = F(); DELAY = F(); VX = F(); VY = F(); SEED = F();
  SX = F(); SY = F(); MX = F(); MY = F(); MD = F(); CURVE = F();
  BUCKET = new Uint8Array(N); LINE = new Uint8Array(N);

  let minX = Infinity, maxX = -Infinity;
  for (let i = 0; i < N; i++) { const x = d.pts[i * 2]; if (x < minX) minX = x; if (x > maxX) maxX = x; }
  const span = Math.max(maxX - minX, 1), reach = Math.min(w, h) * 0.5;
  for (let i = 0; i < N; i++) {
    const x = d.pts[i * 2], y = d.pts[i * 2 + 1];
    X[i] = cx; Y[i] = cy;
    TX[i] = x + (Math.random() - 0.5) * 1.2; TY[i] = y + (Math.random() - 0.5) * 1.2;
    ANG[i] = Math.random() * Math.PI * 2;
    RAD[i] = 60 + Math.pow(Math.random(), 0.7) * reach;
    SPD[i] = (0.25 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1);
    DELAY[i] = Math.random() * 0.5;
    SEED[i] = Math.random() * 10;
    BUCKET[i] = Math.min(BUCKETS - 1, Math.floor(((x - minX) / span) * BUCKETS));
  }
  if (!running) { running = true; last = performance.now(); scope.requestAnimationFrame(tick); }
}

function morph(targets: Float32Array) {
  const T = targets.length / 3;
  if (!T || !N) { scope.postMessage({ type: "morphDone", ok: false }); return; }
  // ghép hạt ↔ điểm đích theo thứ tự x để đám hạt chảy thành khối mạch lạc
  const pi = Array.from({ length: N }, (_, i) => i).sort((a, b) => X[a] - X[b]);
  const ti = Array.from({ length: T }, (_, i) => i).sort((a, b) => targets[a * 3] - targets[b * 3]);
  for (let k = 0; k < N; k++) {
    const i = pi[k], j = ti[Math.min(T - 1, Math.floor((k / N) * T))];
    SX[i] = X[i]; SY[i] = Y[i];
    MX[i] = targets[j * 3] + (Math.random() - 0.5); MY[i] = targets[j * 3 + 1] + (Math.random() - 0.5);
    LINE[i] = Math.min(2, Math.max(0, targets[j * 3 + 2]));
    MD[i] = Math.random() * 0.4;
    CURVE[i] = (Math.random() - 0.5) * 220;
  }
  mode = 1; modeT = 0; morphSignaled = false;
}

function burst() {
  mode = 4; modeT = 0;
  for (let i = 0; i < N; i++) {
    const a = Math.atan2(Y[i] - cy, X[i] - cx) + (Math.random() - 0.5) * 1.2, v = 3 + Math.random() * 13;
    VX[i] = Math.cos(a) * v; VY[i] = Math.sin(a) * v;
  }
}

function tick(now: number) {
  scope.requestAnimationFrame(tick);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now; t += dt; modeT += dt;
  if (!ctx || !N) return;

  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = "lighter";
  let globalAlpha = 1;
  if (mode === 4) globalAlpha = Math.max(0, 1 - modeT / 0.95);
  else if (mode === 3) globalAlpha = Math.max(0, 1 - modeT / (fadeMs / 1000));
  if ((mode === 3 || mode === 4) && globalAlpha <= 0) return;

  for (let i = 0; i < N; i++) {
    let key: number;
    if (mode === 4) {
      X[i] += VX[i] * dt * 60; Y[i] += VY[i] * dt * 60; VX[i] *= 0.985; VY[i] *= 0.985;
      key = BUCKET[i];
    } else if (mode === 0) {
      const g = smooth(clamp01((prog - DELAY[i] * 0.8) / (1 - DELAY[i] * 0.8)));
      ANG[i] += SPD[i] * dt * (1 - g * 0.92);
      const ox = cx + Math.cos(ANG[i]) * RAD[i] * 1.6, oy = cy + Math.sin(ANG[i]) * RAD[i] * 0.7;
      let x = ox + (TX[i] - ox) * g, y = oy + (TY[i] - oy) * g;
      if (g > 0.98) { x += Math.sin(t * 2 + SEED[i]) * 0.9; y += Math.cos(t * 2.3 + SEED[i]) * 0.9; }
      const dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 14400 && d2 > 0.01) { const d = Math.sqrt(d2), push = (1 - d / 120) * 42; x += (dx / d) * push; y += (dy / d) * push; }
      X[i] = x; Y[i] = y;
      key = BUCKET[i] * ALPHA_LEVELS + Math.round(g * (ALPHA_LEVELS - 1));
    } else {
      // biến hình: bay theo đường cong về tên ở hero, màu chuyển dần sang màu chữ thật
      const e = smooth(clamp01((modeT - MD[i]) / MORPH_DUR));
      const dx = MX[i] - SX[i], dy = MY[i] - SY[i], len = Math.hypot(dx, dy) || 1, bow = Math.sin(Math.PI * e) * CURVE[i];
      X[i] = SX[i] + dx * e + (-dy / len) * bow;
      Y[i] = SY[i] + dy * e + (dx / len) * bow;
      if (e >= 1) { X[i] += Math.sin(t * 2 + SEED[i]) * 0.35; Y[i] += Math.cos(t * 2.3 + SEED[i]) * 0.35; }
      key = (BUCKET[i] * (STEPS + 1) + Math.round(e * STEPS)) * 3 + LINE[i];
    }
    if (bins[key].length === 0) used.push(key);
    bins[key].push(i);
  }

  for (let u = 0; u < used.length; u++) {
    const key = used[u], list = bins[key];
    if (mode === 0) {
      ctx.fillStyle = RAINBOW[Math.floor(key / ALPHA_LEVELS)];
      ctx.globalAlpha = 0.5 + 0.5 * ((key % ALPHA_LEVELS) / (ALPHA_LEVELS - 1));
    } else {
      ctx.fillStyle = mode === 4 ? RAINBOW[key] : MORPH_COLOR[key];
      ctx.globalAlpha = globalAlpha;
    }
    ctx.beginPath();
    for (let k = 0; k < list.length; k++) { const i = list[k]; ctx.rect(X[i], Y[i], psize, psize); }
    ctx.fill();
    list.length = 0;
  }
  used.length = 0;

  if (mode === 1 && !morphSignaled && modeT > MORPH_DUR + 0.45) { morphSignaled = true; mode = 2; scope.postMessage({ type: "morphDone", ok: true }); }

  // con trỏ tự vẽ (con trỏ hệ thống bị ẩn trong màn hình loading)
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (mouse.x > -999 && mode < 3) {
    ctx.strokeStyle = "rgba(57,255,20,.85)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#39ff14";
    ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

scope.onmessage = (e: MessageEvent) => {
  const d = e.data;
  switch (d.type) {
    case "init": if (d.canvas) canvas = d.canvas; if (mode === 0) init(d); break;
    case "progress": prog = d.p; break;
    case "mouse": mouse.x = d.x; mouse.y = d.y; break;
    case "morph": morph(d.targets); break;
    case "fade": mode = 3; modeT = 0; fadeMs = d.ms; break;
    case "burst": burst(); break;
  }
};
