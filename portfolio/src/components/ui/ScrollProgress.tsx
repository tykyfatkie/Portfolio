import { useEffect, useRef } from "react";
import { useDeck } from "./SlideDeck";

/** Thanh tiến trình theo slide + vệt sáng spotlight theo chuột toàn trang. */
const ScrollProgress = () => {
  const barRef  = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { index, ids } = useDeck();

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, gx = mx, gy = my, raf = 0;
    const onMove = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    const tick = () => {
      gx += (mx - gx) * 0.08; gy += (my - gy) * 0.08;
      glow.style.transform = `translate3d(${gx - 300}px, ${gy - 300}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, []);

  useEffect(() => {
    if (barRef.current) barRef.current.style.transform = `scaleX(${(index + 1) / Math.max(ids.length, 1)})`;
  }, [index, ids.length]);

  return (
    <>
      <div ref={barRef} className="scroll-progress" />
      <div ref={glowRef} className="cursor-glow" />
    </>
  );
};

export default ScrollProgress;
