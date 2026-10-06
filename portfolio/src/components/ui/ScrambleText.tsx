import { useEffect, useRef } from "react";

const GLYPHS = "!<>-_\/[]{}=+*^?#01";

interface Props { text: string; className?: string; duration?: number }

/** Chữ "giải mã" ngẫu nhiên → chữ thật khi cuộn tới. */
const ScrambleText = ({ text, className, duration = 1100 }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = text
          .split("")
          .map((c, i) => (c === " " || p > (i + 1) / (text.length + 1))
            ? c
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
          .join("");
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      run();
    }, { threshold: 0.6 });
    obs.observe(el);

    // hover → scramble lại
    el.addEventListener("mouseenter", run);
    return () => { obs.disconnect(); cancelAnimationFrame(raf); el.removeEventListener("mouseenter", run); };
  }, [text, duration]);

  return <span ref={ref} className={className}>{text}</span>;
};

export default ScrambleText;
