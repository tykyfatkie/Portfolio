import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Project } from "../../data/projects";

/** Mô hình thiết bị 3D bằng CSS (laptop cho web, điện thoại cho app), xoay theo chuột, màn hình chứa ảnh dự án. */
const DeviceMockup = ({ project }: { project: Project }) => {
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const [imgOk, setImgOk] = useState(true);
  const phone = project.device === "phone";

  useEffect(() => { setImgOk(true); }, [project.id]);

  useEffect(() => {
    const st = stage.current, sc = scene.current;
    if (!st || !sc) return;
    const base = phone ? { x: 0, y: -18 } : { x: -14, y: -24 };
    gsap.set(sc, { rotationX: base.x, rotationY: base.y, transformPerspective: 1500 });
    const rx = gsap.quickTo(sc, "rotationX", { duration: 0.9, ease: "power3.out" });
    const ry = gsap.quickTo(sc, "rotationY", { duration: 0.9, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = st.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      ry(base.y + px * 38);
      rx(base.x - py * 22);
    };
    const leave = () => { rx(base.x); ry(base.y); };
    st.addEventListener("pointermove", move);
    st.addEventListener("pointerleave", leave);
    return () => { st.removeEventListener("pointermove", move); st.removeEventListener("pointerleave", leave); };
  }, [phone, project.id]);

  const screen = project.image && imgOk
    ? <img src={project.image} alt={`${project.title} screenshot`} draggable={false} onError={() => setImgOk(false)} />
    : <div className="dm-ph"><span>{project.number}</span></div>;

  return (
    <div ref={stage} className="dm" data-cursor="TILT">
      <div className="dm__glow" />
      <div className="dm__float">
        <div ref={scene} className="dm__scene">
          {phone ? (
            <div className="dm-phone">
              <div className="dm-phone__screen">{screen}<span className="dm-phone__notch" /></div>
              <span className="dm-phone__shine" />
            </div>
          ) : (
            <div className="dm-laptop">
              <div className="dm-laptop__lid">
                <div className="dm-laptop__screen">{screen}</div>
                <span className="dm-laptop__shine" />
              </div>
              <div className="dm-laptop__deck"><span className="dm-laptop__keys" /><span className="dm-laptop__pad" /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceMockup;
