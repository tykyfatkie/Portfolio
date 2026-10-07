import { useEffect, useRef, useState } from "react";

const KEY = "ty-fps";

/**
 * Bảng đo FPS ẩn: bật/tắt bằng Ctrl+K → "Toggle FPS meter" (hoặc thêm ?fps vào URL).
 * Hiện FPS trung bình, FPS thấp nhất trong ~2 giây gần nhất, thời gian mỗi frame và biểu đồ.
 */
const FpsMeter = () => {
  const [on, setOn] = useState(() => {
    try { return new URLSearchParams(location.search).has("fps") || localStorage.getItem(KEY) === "1"; } catch { return false; }
  });
  const [stat, setStat] = useState({ fps: 0, min: 0, ms: 0 });
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const toggle = () => setOn(v => { const n = !v; try { localStorage.setItem(KEY, n ? "1" : "0"); } catch { /* bỏ qua */ } return n; });
    window.addEventListener("app:fps", toggle);
    return () => window.removeEventListener("app:fps", toggle);
  }, []);

  useEffect(() => {
    if (!on) return;
    const hist: number[] = [];          // thời gian từng frame (ms) trong ~2 giây gần nhất
    let last = performance.now(), raf = 0, acc = 0;
    const tick = (now: number) => {
      const dt = now - last; last = now;
      hist.push(dt);
      let sum = 0, worst = 0;
      for (let i = hist.length - 1; i >= 0; i--) { sum += hist[i]; if (hist[i] > worst) worst = hist[i]; if (sum > 2000) { hist.splice(0, i); break; } }
      acc += dt;
      if (acc > 250) {                  // cập nhật số 4 lần/giây cho dễ đọc
        acc = 0;
        const avg = sum / hist.length;
        setStat({ fps: Math.round(1000 / avg), min: Math.round(1000 / worst), ms: Math.round(avg * 10) / 10 });
      }
      // biểu đồ
      const c = canvas.current;
      const ctx = c?.getContext("2d");
      if (c && ctx) {
        ctx.clearRect(0, 0, c.width, c.height);
        const n = Math.min(hist.length, c.width);
        for (let i = 0; i < n; i++) {
          const ms = hist[hist.length - 1 - i];
          const h = Math.min(c.height, (ms / 33.4) * c.height);
          ctx.fillStyle = ms < 18 ? "#39ff14" : ms < 34 ? "#ffd700" : "#ff2d78";
          ctx.fillRect(c.width - 1 - i, c.height - h, 1, h);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  if (!on) return null;
  const color = stat.fps >= 55 ? "var(--neon)" : stat.fps >= 30 ? "var(--gold)" : "var(--neon2)";
  return (
    <div className="fps">
      <div className="fps__row">
        <b style={{ color }}>{stat.fps}</b><span>FPS</span>
        <em>min {stat.min}</em><em>{stat.ms} ms</em>
      </div>
      <canvas ref={canvas} width={140} height={30} />
    </div>
  );
};

export default FpsMeter;
