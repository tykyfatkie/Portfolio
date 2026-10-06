import { lazy, Suspense, useEffect, useRef } from "react";
import { gsap } from "gsap";

const AboutOrbit = lazy(() => import("../3d/AboutOrbit"));

/** Chip kỹ năng lơ lửng ở các độ sâu khác nhau (z càng lớn càng nổi gần người xem). */
const CHIPS = [
  { t: "NestJS",     c: "#ff2d78", left: "-14%", top: "10%",  z: 190, d: 0 },
  { t: "PHP",        c: "#00cfff", left: "78%",  top: "-6%",   z: 150, d: 0.8 },
  { t: "MariaDB",    c: "#ffd700", left: "86%",  top: "40%",  z: 210, d: 1.6 },
  { t: "Flutter",    c: "#39ff14", left: "-18%", top: "52%",  z: 160, d: 2.2 },
  { t: "React",      c: "#00cfff", left: "74%",  top: "80%",  z: 180, d: 1.1 },
  { t: "TypeScript", c: "#a855f7", left: "-26%", top: "76%",  z: 140, d: 0.4 },
];

/** Thẻ hồ sơ 3D: nghiêng theo chuột, nhiều lớp tách độ sâu bằng translateZ. */
const ProfileCard3D = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current, card = cardRef.current;
    if (!stage || !card) return;
    gsap.set(card, { transformPerspective: 1100 });
    const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 26);
      rx(-py * 22);
      card.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
      card.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
    };
    const onLeave = () => { rx(0); ry(0); };
    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);
    return () => { stage.removeEventListener("mousemove", onMove); stage.removeEventListener("mouseleave", onLeave); };
  }, []);

  return (
    <div ref={stageRef} className="pc">
      <div className="pc__orbit">
        <Suspense fallback={null}><AboutOrbit /></Suspense>
      </div>

      <div className="pc__float">
        <div ref={cardRef} className="pc__card">
          <div className="pc__bg" />
          <div className="pc__grid" />

          <div className="pc__top">
            <span>ID · 001</span>
            <span className="pc__live"><i />ONLINE</span>
          </div>

          <div className="pc__initials" aria-hidden>PHAT</div>

          <div className="pc__info">
            <div className="pc__name">TYPHAT NGUYEN</div>
            <div className="pc__role">Backend Developer</div>
            <div className="pc__org">@ DIGIPAY JSC · Ho Chi Minh City</div>
          </div>

          {CHIPS.map(c => (
            <span key={c.t} className="pc__chip" style={{ left: c.left, top: c.top, transform: `translateZ(${c.z}px)` }}>
              <span style={{ color: c.c, borderColor: c.c, animationDelay: `${c.d}s`, boxShadow: `0 0 18px ${c.c}33` }}>{c.t}</span>
            </span>
          ))}

          <div className="pc__glare" />
        </div>
      </div>
    </div>
  );
};

export default ProfileCard3D;
