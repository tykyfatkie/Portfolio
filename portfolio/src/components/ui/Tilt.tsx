import { useRef, type CSSProperties, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  max?: number;
  className?: string;
  style?: CSSProperties;
}

/** Card nghiêng 3D theo chuột + vệt sáng glare. Cập nhật style trực tiếp, không re-render. */
const Tilt = ({ children, max = 12, className = "", style }: Props) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transition = "transform .1s ease-out";
    el.style.transform = `perspective(800px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) scale3d(1.03,1.03,1.03)`;
    el.style.setProperty("--gx", `${px * 100}%`);
    el.style.setProperty("--gy", `${py * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
    el.style.transform = "perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)";
  };

  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
      <span className="tilt-glare" />
    </div>
  );
};

export default Tilt;
