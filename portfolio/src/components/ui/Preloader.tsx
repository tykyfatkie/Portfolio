import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { preloadAll } from "../../lib/preload";

interface Props {
  /** Gọi khi tải xong: App mount trang chính ngay phía sau màn hình loading. */
  onReady: () => void;
  /** Gọi khi màn hình loading đã mở xong và có thể gỡ khỏi DOM. */
  onDone: () => void;
}

const MIN_SHOW = 1400; // ms — tránh nháy màn hình khi mọi thứ đã nằm trong cache

const Preloader = ({ onReady, onDone }: Props) => {
  const [pct, setPct]     = useState(0);
  const [label, setLabel] = useState("Starting");
  const topRef  = useRef<HTMLDivElement>(null);
  const botRef  = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const shown   = useRef(0);
  const target  = useRef(0);

  useEffect(() => {
    const start = performance.now();
    let raf = 0, finished = false, cancelled = false;

    // Số hiển thị đuổi theo tiến độ thật → chạy mượt, không nhảy cóc
    const tick = () => {
      shown.current += (target.current - shown.current) * 0.12;
      if (target.current - shown.current < 0.05) shown.current = target.current;
      setPct(Math.round(shown.current * 100));
      if (!finished || shown.current < 1) raf = requestAnimationFrame(tick);
    };
    tick();

    preloadAll((p, l) => { target.current = p; setLabel(l); }).then(async () => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
      await new Promise(r => setTimeout(r, wait));
      target.current = 1;
      finished = true;
      // chờ số chạy tới 100
      await new Promise<void>(r => { const t = setInterval(() => { if (cancelled || shown.current >= 0.999) { clearInterval(t); r(); } }, 30); });

      if (cancelled) return;
      onReady();
      await new Promise(r => setTimeout(r, 450)); // cho trang chính mount + 3D khởi tạo xong

      gsap.timeline({ onComplete: onDone })
        .to(bodyRef.current, { opacity: 0, scale: 1.08, duration: 0.5, ease: "power3.in" }, 0)
        .to(topRef.current, { yPercent: -100, duration: 1, ease: "expo.inOut" }, 0.25)
        .to(botRef.current, { yPercent: 100, duration: 1, ease: "expo.inOut" }, 0.25);
    });

    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [onReady, onDone]);

  return (
    <div className="preloader" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Loading">
      <div ref={topRef} className="preloader__half preloader__half--top" />
      <div ref={botRef} className="preloader__half preloader__half--bot" />

      <div ref={bodyRef} className="preloader__body">
        <div className="preloader__cube" aria-hidden>
          <i /><i /><i /><i /><i /><i />
        </div>

        <div className="preloader__brand glitch-wrap" data-text="TYPHAT.DEV">TYPHAT.DEV</div>

        <div className="preloader__num">{String(pct).padStart(3, "0")}<small>%</small></div>

        <div className="preloader__bar"><span style={{ transform: `scaleX(${pct / 100})` }} /></div>

        <div className="preloader__label">
          {pct < 100 ? <>Loading <b>{label}</b></> : "Ready"}
        </div>
      </div>
    </div>
  );
};

export default Preloader;
