import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import type { Project } from "../../data/projects";
import { playClose, playOpen, playTick } from "../../hooks/useSound";
import DeviceMockup from "./DeviceMockup";

interface Props {
  project: Project;
  /** Toạ độ thẻ vừa bấm — khung chi tiết mở ra từ đây và thu về đây khi đóng */
  fromRect: DOMRect | null;
  onNavigate: (dir: 1 | -1) => void;
  onClose: () => void;
}

const roleOf = (tag: string) => tag.split("·")[1]?.trim() ?? tag;

/** Khung chi tiết dự án: mở rộng từ thẻ carousel ra giữa màn hình (animation vị trí + kích thước). */
const ProjectDetail = ({ project, fromRect, onNavigate, onClose }: Props) => {
  const backRef  = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);


  const finalRect = () => {
    const w = Math.min(1080, window.innerWidth * 0.92), h = Math.min(640, window.innerHeight * 0.86);
    return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2, width: w, height: h };
  };

  // Mở: từ thẻ → giữa màn hình
  useEffect(() => {
    document.body.dataset.modal = "project";
    playOpen();
    const panel = panelRef.current!, back = backRef.current!;
    const f = finalRect();
    const from = fromRect
      ? { left: fromRect.left, top: fromRect.top, width: fromRect.width, height: fromRect.height }
      : { ...f, scale: 0.9 };
    const items = panel.querySelectorAll("[data-pd]");
    gsap.set(items, { opacity: 0, y: 24 });
    gsap.set(back, { opacity: 0 });
    gsap.fromTo(panel, { ...from, borderRadius: 18, opacity: fromRect ? 1 : 0 }, { ...f, scale: 1, opacity: 1, borderRadius: 22, duration: 0.8, ease: "expo.inOut" });
    gsap.to(back, { opacity: 1, duration: 0.5 });
    gsap.to(items, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.07, delay: 0.5 });
    return () => { delete document.body.dataset.modal; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    playClose();
    const panel = panelRef.current!, back = backRef.current!;
    const to = fromRect
      ? { left: fromRect.left, top: fromRect.top, width: fromRect.width, height: fromRect.height, borderRadius: 18 }
      : { opacity: 0, scale: 0.92 };
    gsap.to(panel.querySelectorAll("[data-pd]"), { opacity: 0, duration: 0.2 });
    gsap.to(panel, { ...to, duration: 0.65, ease: "expo.inOut", onComplete: onClose });
    gsap.to(back, { opacity: 0, duration: 0.55, delay: 0.1 });
  };

  // Phím: Esc đóng, ←/→ chuyển dự án
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight") { playTick(); onNavigate(1); }
      else if (e.key === "ArrowLeft")  { playTick(); onNavigate(-1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNavigate]);

  const style = { "--c": project.color } as CSSProperties;

  return (
    <div className="pd" style={style}>
      <div ref={backRef} className="pd__back" onClick={close} />
      <div ref={panelRef} className="pd__panel" role="dialog" aria-modal="true" aria-label={project.title}>
        <button className="pd__close" onClick={close} aria-label="Close" data-hover>✕ <span>ESC</span></button>

        <div className="pd__visual">
          <DeviceMockup project={project} />
          <span className="pd__visual-fade" />
          <span className="pd__team" data-pd>TEAM · {project.teamSize}</span>
        </div>

        <div className="pd__body">
          <div className="pd__tag" data-pd>{project.number} / {project.tag}</div>
          <h3 className="pd__title" data-pd>{project.title}</h3>
          <p className="pd__desc" data-pd>{project.description}</p>

          <div className="pd__meta" data-pd>
            <div><b>Role</b><span>{roleOf(project.tag)}</span></div>
            <div><b>Team</b><span>{project.teamSize} {project.teamSize === 1 ? "person" : "people"}</span></div>
            <div><b>Stack</b><span>{project.tech.length} technologies</span></div>
          </div>

          <div className="pd__pills" data-pd>
            {project.tech.map(t => <span key={t}>{t}</span>)}
          </div>

          <div className="pd__links" data-pd>
            {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" data-hover>GitHub ↗</a>}
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" data-hover>Live ↗</a>}
            <span className="pd__nav">
              <button onClick={() => { playTick(); onNavigate(-1); }} aria-label="Previous project" data-hover>←</button>
              <button onClick={() => { playTick(); onNavigate(1); }} aria-label="Next project" data-hover>→</button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
