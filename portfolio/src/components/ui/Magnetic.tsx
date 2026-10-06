import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";

/** Phần tử bị "hút" về phía con trỏ khi lại gần. */
const Magnetic = ({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
      duration: 0.3, ease: "power3.out",
    });
  };
  const onLeave = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1,0.35)" });
  };

  return (
    <span ref={ref} style={{ display: "inline-block" }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </span>
  );
};

export default Magnetic;
