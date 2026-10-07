import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Chữ TYPHAT.DEV ghép từ hàng nghìn hạt sáng (Canvas 2D).
 * Tiến độ tải càng cao, hạt càng hội tụ về đúng vị trí của chữ; lúc 0% chúng xoay hỗn loạn quanh tâm. Hạt né con trỏ chuột.
 * Khi tải xong: `morph()` biến cả đám hạt thành đúng tên ở hero (đọc vị trí/font từ DOM), `fade()` làm hạt tan đi,
 * `burst()` (dự phòng) làm hạt nổ tung.
 */
export interface ParticlesHandle {
  /** Trả về true nếu tìm thấy tên ở hero và biến hình xong; false nếu không (khi đó hãy dùng burst) */
  morph: () => Promise<boolean>;
  fade: (ms: number) => void;
  burst: () => void;
}

interface Props {
  progress: MutableRefObject<number>;   // tiến độ hiển thị 0..1 (đã làm mượt)
  handle: MutableRefObject<ParticlesHandle | null>;
  text?: string;
}

interface P {
  x: number; y: number;           // vị trí đang vẽ
  tx: number; ty: number;         // đích của chữ TYPHAT.DEV
  ang: number; rad: number; spd: number; delay: number;
  vx: number; vy: number;
  bucket: number; size: number; seed: number;
  // biến hình
  sx: number; sy: number; mx: number; my: number; md: number; curve: number;
  r: number; g: number; b: number; tr: number; tg: number; tb: number;
}

const BUCKETS = 14;
const hueOf = (b: number) => 115 + (b / (BUCKETS - 1)) * 215;   // xanh lá → xanh lơ → xanh dương → hồng
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  const f = (n: number) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

const LoaderParticles = ({ progress, handle, text = "TYPHAT.DEV" }: Props) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0, h = 0, cx = 0, cy = 0, raf = 0, alive = true;
    let parts: P[] = [];
    // mode: 0 = ghép chữ theo tiến độ, 1 = biến hình sang tên hero, 2 = giữ nguyên, 3 = tan, 4 = nổ tung
    let mode = 0, modeT = 0, last = performance.now(), t = 0, fadeMs = 600;
    let morphDone: (() => void) | null = null;
    const MORPH_DUR = 1.25;
    const mouse = { x: -9999, y: -9999 };

    const build = async () => {
      try { await document.fonts.load("200px 'Bebas Neue'"); } catch { /* dùng font dự phòng */ }
      if (!alive) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w / 2; cy = h * 0.4;

      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      const fs = Math.min(w * 0.16, h * 0.3);
      o.font = `${fs}px 'Bebas Neue', Impact, sans-serif`;
      o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#fff";
      o.fillText(text, cx, cy);
      const img = o.getImageData(0, 0, w, h).data;

      let step = w < 700 ? 3 : 4;
      let pts: [number, number][] = [];
      for (;;) {
        pts = [];
        for (let y = 0; y < h; y += step)
          for (let x = 0; x < w; x += step)
            if (img[(y * w + x) * 4 + 3] > 128) pts.push([x, y]);
        if (pts.length <= 3600 || step > 9) break;
        step++;
      }

      const minX = Math.min(...pts.map(p => p[0])), maxX = Math.max(...pts.map(p => p[0]));
      const span = Math.max(maxX - minX, 1);
      const reach = Math.min(w, h) * 0.5;
      parts = pts.map(([x, y]) => {
        const bucket = Math.min(BUCKETS - 1, Math.floor(((x - minX) / span) * BUCKETS));
        const [r, g, b] = hslToRgb(hueOf(bucket), 1, 0.6);
        return {
          x: cx, y: cy, tx: x + (Math.random() - 0.5) * 1.2, ty: y + (Math.random() - 0.5) * 1.2,
          ang: Math.random() * Math.PI * 2,
          rad: 60 + Math.pow(Math.random(), 0.7) * reach,
          spd: (0.25 + Math.random() * 0.7) * (Math.random() < 0.5 ? -1 : 1),
          delay: Math.random() * 0.5,
          vx: 0, vy: 0, bucket,
          size: step <= 3 ? 1.8 : 2.4,
          seed: Math.random() * 10,
          sx: 0, sy: 0, mx: 0, my: 0, md: 0, curve: 0, r, g, b, tr: r, tg: g, tb: b,
        };
      }).sort((a, b) => a.bucket - b.bucket);
    };

    /** Lấy điểm đích từ tên ở hero: vẽ lại đúng chữ, đúng font, đúng vị trí đang hiển thị trong DOM. */
    const heroTargets = (): { x: number; y: number; line: number }[] | null => {
      const h1 = document.querySelector<HTMLElement>(".xt-title");
      const lines = Array.from(document.querySelectorAll<HTMLElement>(".xt-front .glitch-wrap, .xt-front [aria-label]"));
      if (!h1 || lines.length === 0) return null;
      const cs = getComputedStyle(h1);
      const off = document.createElement("canvas");
      off.width = w; off.height = h;
      const o = off.getContext("2d", { willReadFrequently: true })!;
      o.textAlign = "center"; o.textBaseline = "alphabetic"; o.fillStyle = "#fff";
      o.font = `${cs.fontSize} ${cs.fontFamily}`;
      (o as unknown as { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
      const fsPx = parseFloat(cs.fontSize);
      lines.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const txt = el.getAttribute("aria-label") ?? el.dataset.text ?? el.textContent ?? "";
        o.globalAlpha = 1;
        // baseline chữ Bebas ≈ đáy hộp dòng trừ ~ (line-height - cap-height)/2 ; dùng tỉ lệ thực nghiệm theo cỡ chữ
        o.fillStyle = `rgb(${i + 1}, 0, 0)`;                 // mã hoá chỉ số dòng vào kênh đỏ để phân biệt màu sau này
        o.fillText(txt, r.left + r.width / 2, r.top + r.height / 2 + fsPx * 0.25);
      });
      const data = o.getImageData(0, 0, w, h).data;
      const step = 4;
      const out: { x: number; y: number; line: number }[] = [];
      for (let y = 0; y < h; y += step)
        for (let x = 0; x < w; x += step) {
          const k = (y * w + x) * 4;
          if (data[k + 3] > 128) out.push({ x: x + (Math.random() - 0.5), y: y + (Math.random() - 0.5), line: data[k] - 1 });
        }
      return out.length ? out : null;
    };

    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("pointermove", onMove, { passive: true });
    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { if (mode === 0) build(); }, 200); };
    window.addEventListener("resize", onResize);

    handle.current = {
      morph: () => new Promise<boolean>(resolve => {
        const targets = parts.length ? heroTargets() : null;
        if (!targets) { resolve(false); return; }
        // ghép hạt ↔ điểm đích theo thứ tự x để đám hạt chảy thành khối mạch lạc
        const byX = [...parts].sort((a, b) => a.x - b.x);
        const tg = targets.length > byX.length
          ? targets.filter(() => Math.random() < byX.length / targets.length).slice(0, byX.length)
          : targets;
        tg.sort((a, b) => a.x - b.x);
        const pal: [number, number, number][] = [[245, 245, 245], [57, 255, 20], [245, 245, 245]];
        byX.forEach((p, i) => {
          const dst = tg[Math.min(tg.length - 1, Math.floor((i / byX.length) * tg.length))];
          p.sx = p.x; p.sy = p.y; p.mx = dst.x; p.my = dst.y;
          p.md = Math.random() * 0.4;
          p.curve = (Math.random() - 0.5) * 220;
          const c = pal[Math.min(2, Math.max(0, dst.line))];
          p.tr = c[0]; p.tg = c[1]; p.tb = c[2];
        });
        mode = 1; modeT = 0;
        morphDone = () => resolve(true);
      }),
      fade: ms => { mode = 3; modeT = 0; fadeMs = ms; },
      burst: () => {
        mode = 4; modeT = 0;
        parts.forEach(p => {
          const a = Math.atan2(p.y - cy, p.x - cx) + (Math.random() - 0.5) * 1.2;
          const v = 3 + Math.random() * 13;
          p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
        });
      },
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt; modeT += dt;
      if (!w) return;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const prog = progress.current;

      let curBucket = -1;
      for (const p of parts) {
        let alpha = 1;
        if (mode === 4) {
          p.x += p.vx * dt * 60; p.y += p.vy * dt * 60;
          p.vx *= 0.985; p.vy *= 0.985;
          alpha = Math.max(0, 1 - modeT / 0.95);
        } else if (mode === 0) {
          const g = smooth(clamp01((prog - p.delay * 0.8) / (1 - p.delay * 0.8)));
          p.ang += p.spd * dt * (1 - g * 0.92);
          const ox = cx + Math.cos(p.ang) * p.rad * 1.6;
          const oy = cy + Math.sin(p.ang) * p.rad * 0.7;
          let x = ox + (p.tx - ox) * g;
          let y = oy + (p.ty - oy) * g;
          if (g > 0.98) { x += Math.sin(t * 2 + p.seed) * 0.9; y += Math.cos(t * 2.3 + p.seed) * 0.9; }
          const dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120 && d2 > 0.01) { const d = Math.sqrt(d2), push = (1 - d / 120) * 42; x += (dx / d) * push; y += (dy / d) * push; }
          p.x = x; p.y = y;
          alpha = 0.5 + 0.5 * g;
        } else {
          // mode 1/2/3: bay về tên ở hero theo đường cong, đổi màu sang màu chữ thật
          const e = smooth(clamp01((modeT - p.md) / MORPH_DUR));
          const dx = p.mx - p.sx, dy = p.my - p.sy;
          const len = Math.hypot(dx, dy) || 1;
          const bow = Math.sin(Math.PI * e) * p.curve;
          p.x = p.sx + dx * e + (-dy / len) * bow;
          p.y = p.sy + dy * e + (dx / len) * bow;
          if (e >= 1) { p.x += Math.sin(t * 2 + p.seed) * 0.35; p.y += Math.cos(t * 2.3 + p.seed) * 0.35; }
          p.r += (p.tr - p.r) * 0.08; p.g += (p.tg - p.g) * 0.08; p.b += (p.tb - p.b) * 0.08;
          alpha = mode === 3 ? Math.max(0, 1 - modeT / (fadeMs / 1000)) : 1;
        }

        ctx.globalAlpha = alpha;
        if (mode >= 1 && mode !== 4) {
          ctx.fillStyle = `rgb(${p.r | 0},${p.g | 0},${p.b | 0})`;
        } else if (p.bucket !== curBucket) { curBucket = p.bucket; ctx.fillStyle = `hsl(${hueOf(p.bucket)} 100% 60%)`; }
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      if (mode === 1 && modeT > MORPH_DUR + 0.45) { mode = 2; morphDone?.(); morphDone = null; }

      // con trỏ tự vẽ (con trỏ hệ thống bị ẩn trong màn hình loading)
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      if (mouse.x > -999 && mode < 3) {
        ctx.strokeStyle = "rgba(57,255,20,.85)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#39ff14";
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    };

    build().then(() => { if (alive) raf = requestAnimationFrame(tick); });

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      handle.current = null;
    };
  }, [progress, handle, text]);

  return <canvas ref={ref} className="preloader__canvas" aria-hidden />;
};

export default LoaderParticles;
