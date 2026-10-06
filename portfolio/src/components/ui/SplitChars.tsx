import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** Tách từng chữ và lật 3D vào lần lượt. */
const SplitChars = ({ text, delay = 0.4, style }: { text: string; delay?: number; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chars = el.querySelectorAll(".char");
    const tween = gsap.fromTo(chars,
      { opacity: 0, y: 80, z: -420, rotateX: -90, scale: 0.6 },
      { opacity: 1, y: 0, z: 0, rotateX: 0, scale: 1, duration: 1.1, ease: "back.out(1.6)", stagger: 0.06, delay });
    return () => { tween.kill(); };
  }, [delay]);

  return (
    <span ref={ref} style={{ display: "inline-block", perspective: 600, ...style }} aria-label={text}>
      {text.split("").map((c, i) => (
        <span key={i} className="char" aria-hidden style={{ display: "inline-block", transformOrigin: "50% 100%", whiteSpace: "pre" }}>{c}</span>
      ))}
    </span>
  );
};

export default SplitChars;
