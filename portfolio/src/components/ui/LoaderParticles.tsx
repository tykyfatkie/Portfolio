import { useEffect, useRef, type MutableRefObject } from "react";

/**
 * Chữ TYPHAT.DEV ghép từ hàng nghìn hạt sáng. Phần vẽ chạy trong Web Worker (loaderWorker.ts) trên OffscreenCanvas,
 * nên khi luồng chính bận dựng trang chủ thì hạt vẫn chạy mượt. Component này chỉ:
 *  - lấy mẫu điểm của chữ (cần font của trang) rồi gửi cho worker,
 *  - chuyển tiến độ tải và vị trí chuột sang worker,
 *  - khi tải xong: đọc vị trí/font của tên ở hero để worker biến hình đám hạt thành đúng tên đó.
 */
export interface ParticlesHandle {
  /** true nếu tìm thấy tên ở hero và biến hình xong; false nếu không (khi đó hãy dùng burst) */
  morph: () => Promise<boolean>;
  fade: (ms: number) => void;
  burst: () => void;
}

interface Props {
  progress: MutableRefObject<number>;   // tiến độ hiển thị 0..1 (đã làm mượt)
  handle: MutableRefObject<ParticlesHandle | null>;
  text?: string;
}

const BASELINE_K = 0.25;   // baseline chữ = tâm dòng + 0.25·fontSize (đã hiệu chỉnh khớp bản DOM)

/** Lấy mẫu điểm của chữ TYPHAT.DEV ở giữa màn hình. */
function sampleText(text: string, w: number, h: number) {
  const cx = w / 2, cy = h * 0.4;
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const o = off.getContext("2d", { willReadFrequently: true })!;
  const fs = Math.min(w * 0.16, h * 0.3);
  o.font = `${fs}px 'Bebas Neue', Impact, sans-serif`;
  o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#fff";
  o.fillText(text, cx, cy);
  const img = o.getImageData(0, 0, w, h).data;
  let step = w < 700 ? 3 : 4, pts: number[] = [];
  for (;;) {
    pts = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (img[(y * w + x) * 4 + 3] > 128) pts.push(x, y);
    if (pts.length / 2 <= 3600 || step > 9) break;
    step++;
  }
  return { pts: new Float32Array(pts), cx, cy, psize: step <= 3 ? 1.8 : 2.4 };
}

/** Điểm đích từ tên ở hero: vẽ lại đúng chữ, đúng font, đúng vị trí đang có trong DOM. Mỗi điểm: x, y, chỉ số dòng. */
function heroTargets(w: number, h: number): Float32Array | null {
  const h1 = document.querySelector<HTMLElement>(".xt-title");
  const lines = Array.from(document.querySelectorAll<HTMLElement>(".xt-front .glitch-wrap, .xt-front [aria-label]"));
  if (!h1 || !lines.length) return null;
  const cs = getComputedStyle(h1);
  const off = document.createElement("canvas");
  off.width = w; off.height = h;
  const o = off.getContext("2d", { willReadFrequently: true })!;
  o.textAlign = "center"; o.textBaseline = "alphabetic";
  o.font = `${cs.fontSize} ${cs.fontFamily}`;
  (o as unknown as { letterSpacing: string }).letterSpacing = cs.letterSpacing === "normal" ? "0px" : cs.letterSpacing;
  const fs = parseFloat(cs.fontSize);
  lines.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    o.fillStyle = `rgb(${i + 1},0,0)`;            // chỉ số dòng mã hoá trong kênh đỏ
    o.fillText(el.getAttribute("aria-label") ?? el.dataset.text ?? el.textContent ?? "", r.left + r.width / 2, r.top + r.height / 2 + fs * BASELINE_K);
  });
  const data = o.getImageData(0, 0, w, h).data;
  const out: number[] = [];
  for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { const k = (y * w + x) * 4; if (data[k + 3] > 128) out.push(x, y, data[k] - 1); }
  return out.length ? new Float32Array(out) : null;
}

const LoaderParticles = ({ progress, handle, text = "TYPHAT.DEV" }: Props) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let alive = true;

    // Mỗi lần mount tạo canvas mới (canvas đã chuyển sang worker thì không chuyển lần hai được)
    const canvas = document.createElement("canvas");
    canvas.className = "preloader__canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const noop: ParticlesHandle = { morph: async () => false, fade: () => {}, burst: () => {} };
    const supported = typeof (canvas as { transferControlToOffscreen?: unknown }).transferControlToOffscreen === "function";
    if (!supported) { handle.current = noop; return () => { canvas.remove(); handle.current = null; }; }

    const offscreen = canvas.transferControlToOffscreen();
    const worker = new Worker(new URL("./loaderWorker.ts", import.meta.url), { type: "module" });
    let transferred = false;
    let pending: ((ok: boolean) => void) | null = null;
    worker.onmessage = e => { if (e.data?.type === "morphDone") { pending?.(!!e.data.ok); pending = null; } };

    const send = async () => {
      try { await document.fonts.load("200px 'Bebas Neue'"); } catch { /* font dự phòng */ }
      if (!alive) return;
      const w = window.innerWidth, h = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      const s = sampleText(text, w, h);
      const msg = { type: "init", w, h, dpr, cx: s.cx, cy: s.cy, psize: s.psize, pts: s.pts } as Record<string, unknown>;
      if (!transferred) { msg.canvas = offscreen; worker.postMessage(msg, [offscreen, s.pts.buffer]); transferred = true; }
      else worker.postMessage(msg, [s.pts.buffer]);
    };
    send();

    // tiến độ → worker (chỉ gửi khi đổi)
    let raf = 0, lastP = -1;
    const pump = () => {
      const p = progress.current;
      if (Math.abs(p - lastP) > 0.0005) { lastP = p; worker.postMessage({ type: "progress", p }); }
      raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);

    const onMove = (e: PointerEvent) => worker.postMessage({ type: "mouse", x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove, { passive: true });
    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(send, 200); };
    window.addEventListener("resize", onResize);

    handle.current = {
      morph: () => new Promise<boolean>(resolve => {
        const targets = heroTargets(window.innerWidth, window.innerHeight);   // tính ngay, đồng bộ (trước khi hero bị dời đi)
        if (!targets) { resolve(false); return; }
        pending = resolve;
        worker.postMessage({ type: "morph", targets }, [targets.buffer]);
      }),
      fade: ms => worker.postMessage({ type: "fade", ms }),
      burst: () => worker.postMessage({ type: "burst" }),
    };

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      pending?.(false);
      worker.terminate();
      canvas.remove();
      handle.current = null;
    };
  }, [progress, handle, text]);

  return <div ref={hostRef} />;
};

export default LoaderParticles;
