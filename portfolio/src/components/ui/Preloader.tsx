import { useEffect, useRef, useState } from "react";
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
  const [stage, setStage]   = useState<"loading" | "finalizing" | "ready">("loading");
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
    let lastT = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.25);
      lastT = now;
      shown.current += (target.current - shown.current) * (1 - Math.exp(-dt * 3.6));
      if (target.current - shown.current < 0.0015) shown.current = target.current;
      setPct(Math.round(shown.current * 100));
      if (!finished || shown.current < 1) raf = requestAnimationFrame(tick);
    };
    tick();

    // Chờ cho tới khi trang chính dựng xong và main thread chạy mượt trở lại (nhiều frame liên tiếp nhanh)
    const waitSmooth = (minHold: number, timeout: number) => new Promise<void>(resolve => {
      const t0 = performance.now();
      let prev = t0, good = 0;
      const step = (now: number) => {
        const dt = now - prev; prev = now;
        good = dt < 34 ? good + 1 : 0;
        const held = now - t0;
        if (cancelled || (held >= minHold && good >= 10) || held >= timeout) resolve();
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    preloadAll((p, l, d) => { target.current = Math.min(p, 0.99); setLabel(l); setDetail(d); }).then(async () => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
      await new Promise(r => setTimeout(r, wait));
      if (cancelled) return;

      // 1) Giữ ở 99%: dựng trang chính ngầm phía sau. Phần giật do dựng 3D rơi vào đoạn này,
      //    không rơi vào outro.
      setStage("finalizing");
      const titleReady = new Promise<void>(res => {
        const done = () => res();
        window.addEventListener("hero:title-ready", done, { once: true });
        setTimeout(done, 5000);                     // chữ 3D lỗi/chậm → vẫn tiếp tục với bản DOM
      });
      onReady();
      await titleReady;                             // chờ chữ 3D dựng xong hẳn (hình học + shader)
      if (cancelled) return;
      await waitSmooth(600, 4000);
      if (cancelled) return;

      // 2) Trang đã sẵn sàng và chạy mượt → mới nhảy lên 100%, các hạt hội tụ nốt
      target.current = 1;
      finished = true;
      setStage("ready");
      await new Promise<void>(r => { const t = setInterval(() => { if (cancelled || shown.current >= 0.999) { clearInterval(t); r(); } }, 30); });
      if (cancelled) return;
      await new Promise(r => setTimeout(r, 450));   // giữ chữ hoàn chỉnh một nhịp
      if (cancelled) return;

      // 3) Outro: các hạt biến hình thành đúng tên "NGUYEN TANG TAI PHAT" ở hero (đang nằm sẵn dưới màn hình loading),
      //    rồi màn hình tách đôi để lộ chữ thật khớp đúng vị trí và các hạt tan đi.
      //    Nếu không tìm thấy tên ở hero thì dùng hiệu ứng nổ tung làm dự phương.
      // Dùng Web Animations: chạy trên luồng compositor nên vẫn mượt dù luồng chính đang bận dựng trang chính phía sau
      const play = (el: HTMLElement | null, kf: Keyframe[], duration: number, easing: string, delay = 0) =>
        el?.animate(kf, { duration, easing, delay, fill: "forwards" });
      const EXPO = "cubic-bezier(0.87, 0, 0.13, 1)", IN = "cubic-bezier(0.55, 0.055, 0.675, 0.19)";
      play(uiRef.current, [{ opacity: 1, transform: "translate(-50%, 0)" }, { opacity: 0, transform: "translate(-50%, 24px)" }], 500, IN);
      // Tính điểm đích (đồng bộ, lúc hero còn đúng chỗ), rồi tạm dời trang chính ra khỏi khung nhìn để các canvas WebGL của hero
      // tự dừng vẽ (IntersectionObserver) → dồn GPU cho hiệu ứng hạt. Đưa về lại ngay trước khi màn hình mở.
      const morphP = particles.current?.morph() ?? Promise.resolve(false);
      const deck = document.querySelector<HTMLElement>(".deck");
      if (deck) deck.style.transform = "translateY(110vh)";
      const morphed = await morphP;
      if (deck) deck.style.transform = "";
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));   // cho hero vẽ lại một khung mới
      if (cancelled) return;
      if (!morphed) particles.current?.burst();
      else await new Promise(r => setTimeout(r, 250));
      particles.current?.fade(morphed ? 800 : 600);
      const gap = morphed ? 50 : 350;
      play(cornerRef.current, [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.12)" }], 700, IN);
      const top = play(topRef.current, [{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], 1100, EXPO, gap);
      const bot = play(botRef.current, [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], 1100, EXPO, gap);
      await Promise.all([top?.finished, bot?.finished]);
      if (!cancelled) onDone();
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
          {stage === "loading" ? <>Loading <b>{label}</b></> : stage === "finalizing" ? <>Finalizing <b>scene</b></> : "System ready"}
        </div>
      </div>
    </div>
  );
};

export default Preloader;
