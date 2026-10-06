import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { preloadAll, type TaskDetail } from "../../lib/preload";
import LoaderParticles, { type ParticlesHandle } from "./LoaderParticles";

interface Props {
  /** Gọi khi tải xong: App mount trang chính ngay phía sau màn hình loading. */
  onReady: () => void;
  /** Gọi khi màn hình loading đã mở xong và có thể gỡ khỏi DOM. */
  onDone: () => void;
}

const MIN_SHOW = 1800; // ms — đủ để thấy các hạt kịp ghép thành chữ ngay cả khi mọi thứ đã nằm trong cache

const Preloader = ({ onReady, onDone }: Props) => {
  const [pct, setPct]       = useState(0);
  const [label, setLabel]   = useState("Starting");
  const [detail, setDetail] = useState<TaskDetail[]>([]);
  const topRef  = useRef<HTMLDivElement>(null);
  const botRef  = useRef<HTMLDivElement>(null);
  const uiRef   = useRef<HTMLDivElement>(null);
  const cornerRef = useRef<HTMLDivElement>(null);
  const shown   = useRef(0);   // tiến độ hiển thị (làm mượt) — canvas cũng đọc giá trị này
  const target  = useRef(0);
  const particles = useRef<ParticlesHandle | null>(null);

  useEffect(() => {
    const start = performance.now();
    let raf = 0, finished = false, cancelled = false;

    // Số hiển thị đuổi theo tiến độ thật → chạy mượt, không nhảy cóc
    const tick = () => {
      shown.current += (target.current - shown.current) * 0.06;
      if (target.current - shown.current < 0.0015) shown.current = target.current;
      setPct(Math.round(shown.current * 100));
      if (!finished || shown.current < 1) raf = requestAnimationFrame(tick);
    };
    tick();

    preloadAll((p, l, d) => { target.current = p; setLabel(l); setDetail(d); }).then(async () => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
      await new Promise(r => setTimeout(r, wait));
      target.current = 1;
      finished = true;
      // chờ số chạy tới 100 (các hạt cũng hội tụ hoàn toàn lúc này)
      await new Promise<void>(r => { const t = setInterval(() => { if (cancelled || shown.current >= 0.999) { clearInterval(t); r(); } }, 30); });
      if (cancelled) return;

      await new Promise(r => setTimeout(r, 650));   // giữ chữ hoàn chỉnh một nhịp
      if (cancelled) return;
      onReady();                                    // mount trang chính ngay phía sau
      particles.current?.burst();                   // hạt nổ tung
      await new Promise(r => setTimeout(r, 500));   // cho trang chính mount + 3D khởi tạo xong

      gsap.timeline({ onComplete: onDone })
        .to(uiRef.current, { opacity: 0, y: 30, duration: 0.45, ease: "power3.in" }, 0)
        .to(cornerRef.current, { opacity: 0, scale: 1.12, duration: 0.6, ease: "power3.in" }, 0)
        .to(topRef.current, { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, 0.2)
        .to(botRef.current, { yPercent: 100, duration: 1.05, ease: "expo.inOut" }, 0.2);
    });

    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [onReady, onDone]);

  return (
    <div className="preloader" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Loading">
      <div ref={topRef} className="preloader__half preloader__half--top" />
      <div ref={botRef} className="preloader__half preloader__half--bot" />

      <LoaderParticles progress={shown} handle={particles} />

      <div ref={cornerRef} className="preloader__corners" aria-hidden>
        <i /><i /><i /><i />
        <span className="preloader__tl">PORTFOLIO · 2025</span>
        <span className="preloader__tr">BACKEND · MOBILE · WEB</span>
      </div>

      <div ref={uiRef} className="preloader__ui">
        <div className="preloader__num">{String(pct).padStart(3, "0")}<small>%</small></div>

        <div className="preloader__bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>

        <ul className="preloader__tasks">
          {detail.map(d => (
            <li key={d.label} className={d.frac >= 1 ? "is-done" : d.frac > 0 ? "is-run" : ""}>
              <span className="preloader__task-name">
                {d.label}<em>{d.frac >= 1 ? "✓" : `${Math.round(d.frac * 100)}%`}</em>
              </span>
              <span className="preloader__task-bar"><span style={{ transform: `scaleX(${d.frac})` }} /></span>
            </li>
          ))}
        </ul>

        <div className="preloader__label">
          {pct < 100 ? <>Loading <b>{label}</b></> : "System ready"}
        </div>
      </div>
    </div>
  );
};

export default Preloader;
