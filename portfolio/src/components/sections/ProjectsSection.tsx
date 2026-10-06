import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import ScrambleText from "../ui/ScrambleText";
import Backdrop from "../3d/Backdrops";
import ProjectDetail from "../ui/ProjectDetail";
import { useDeck } from "../ui/SlideDeck";
import { PROJECTS, type Project } from "../../data/projects";
import { playTick } from "../../hooks/useSound";

const GAP = 300;     // khoảng cách ngang giữa các thẻ (px)
const DEPTH = 190;   // độ lùi sâu mỗi bậc (px)
const TURN = 38;     // góc xoay mỗi bậc (độ)

/** Một thẻ trong băng chuyền 3D. Thẻ ở giữa nghiêng theo chuột; bấm thẻ bên cạnh để chuyển, bấm thẻ giữa để mở chi tiết. */
const Card = ({ p, offset, onPick }: { p: Project; offset: number; onPick: (el: HTMLElement) => void }) => {
  const inRef = useRef<HTMLDivElement>(null);
  const [imgOk, setImgOk] = useState(true);
  const abs = Math.abs(offset);
  const showImg = p.image && imgOk;

  const onMove = (e: React.MouseEvent) => {
    if (offset !== 0) return;
    const el = inRef.current!;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${px * 16}deg`);
    el.style.setProperty("--rx", `${-py * 14}deg`);
    el.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
  };
  const onLeave = () => {
    const el = inRef.current!;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  const style = {
    "--c": p.color,
    transform: `translateX(calc(-50% + ${offset * GAP}px)) translateZ(${-abs * DEPTH}px) rotateY(${-offset * TURN}deg) scale(${offset === 0 ? 1 : 0.94})`,
    zIndex: 50 - abs,
    opacity: abs > 3 ? 0 : 1,
    filter: offset === 0 ? "none" : `brightness(${Math.max(0.28, 0.62 - abs * 0.12)}) saturate(.8)`,
    pointerEvents: abs > 3 ? "none" : "auto",
  } as CSSProperties;

  return (
    <div className={`pj-card${offset === 0 ? " is-active" : ""}`} style={style}
      onMouseMove={onMove} onMouseLeave={onLeave}
      onClick={e => onPick(e.currentTarget)} data-hover>
      <div ref={inRef} className="pj-card__in">
        <div className="pj-card__media">
          {showImg
            ? <img src={p.image} alt={`${p.title} screenshot`} draggable={false} onError={() => setImgOk(false)} />
            : <div className="pj-ph"><span>{p.number}</span></div>}
          <span className="pj-card__shade" />
          <span className="pj-card__team">TEAM {p.teamSize}</span>
        </div>
        <div className="pj-card__text">
          <div className="pj-card__tag">{p.tag}</div>
          <div className="pj-card__title">{p.title}</div>
        </div>
        <span className="pj-card__glare" />
      </div>
    </div>
  );
};

const ProjectsSection = () => {
  const { index: slideIndex, ids } = useDeck();
  const isCurrent = ids[slideIndex] === "projects";

  const [active, setActive] = useState(0);
  const [detail, setDetail] = useState<{ project: Project; rect: DOMRect | null } | null>(null);
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const cur = PROJECTS[active];

  const step = useCallback((d: number) => {
    setActive(a => {
      const n = Math.min(PROJECTS.length - 1, Math.max(0, a + d));
      if (n !== a) playTick();
      return n;
    });
  }, []);

  const openDetail = (el?: HTMLElement) => {
    const node = el ?? document.querySelector<HTMLElement>(".pj-card.is-active");
    setDetail({ project: PROJECTS[active], rect: node ? node.getBoundingClientRect() : null });
  };

  // ←/→ chuyển thẻ, Enter mở chi tiết — chỉ khi đang ở slide Projects và chưa mở khung chi tiết
  useEffect(() => {
    if (!isCurrent || detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (document.body.dataset.modal || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "Enter") openDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrent, detail, step, active]);

  // Bảng lệnh Ctrl+K có thể chọn sẵn một dự án
  useEffect(() => {
    const onSel = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      const i = PROJECTS.findIndex(p => p.id === id);
      if (i >= 0) setActive(i);
    };
    window.addEventListener("app:select-project", onSel);
    return () => window.removeEventListener("app:select-project", onSel);
  }, []);

  const pick = (i: number, el: HTMLElement) => {
    if (suppressClick.current) return;
    if (i === active) openDetail(el);
    else { setActive(i); playTick(); }
  };

  // Kéo ngang để chuyển thẻ
  const onDown = (e: React.PointerEvent) => { dragRef.current = { x: e.clientX, moved: false }; };
  const onMoveStage = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 70) {
      d.x = e.clientX; d.moved = true; suppressClick.current = true;
      step(dx < 0 ? 1 : -1);
    }
  };
  const onUp = () => {
    const moved = dragRef.current?.moved;
    dragRef.current = null;
    if (moved) setTimeout(() => { suppressClick.current = false; }, 60);
  };

  // Đổi dự án ngay trong khung chi tiết
  const navigateDetail = useCallback((dir: 1 | -1) => {
    setActive(a => {
      const n = (a + dir + PROJECTS.length) % PROJECTS.length;
      setDetail(d => d ? { ...d, project: PROJECTS[n], rect: null } : d);
      return n;
    });
  }, []);

  return (
    <section id="projects" style={{ background: "var(--bg2)", padding: "8rem 0 5rem", minHeight: "100vh", ["--pj-c" as string]: cur.color } as CSSProperties}>
      <Backdrop kind="stream" opacity={0.42} />
      <div className="pj-glow" />

      <div className="pj-wrap">
        <div data-fx="up" className="pj-head">
          <div>
            <p className="section-label">03 / Work</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 0.95 }}>
              SELECTED <ScrambleText text="PROJECTS" className="neon-green" />
            </h2>
            <span className="title-underline" />
          </div>
          <div className="pj-count"><b>{String(active + 1).padStart(2, "0")}</b><span>/ {String(PROJECTS.length).padStart(2, "0")}</span></div>
        </div>

        {/* Băng chuyền 3D */}
        <div data-fx="zoom" className="pj-carousel">
          <div className="pj-stage" onPointerDown={onDown} onPointerMove={onMoveStage} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>
            {PROJECTS.map((p, i) => <Card key={p.id} p={p} offset={i - active} onPick={el => pick(i, el)} />)}
          </div>

          <div className="pj-controls">
            <button className="pj-nav" onClick={() => step(-1)} disabled={active === 0} aria-label="Previous project" data-hover>←</button>
            <div className="pj-dots">
              {PROJECTS.map((p, i) => (
                <button key={p.id} className={i === active ? "is-active" : ""} style={{ "--c": p.color } as CSSProperties}
                  onClick={() => { setActive(i); playTick(); }} aria-label={p.title} data-hover />
              ))}
            </div>
            <button className="pj-nav" onClick={() => step(1)} disabled={active === PROJECTS.length - 1} aria-label="Next project" data-hover>→</button>
          </div>
          <p className="pj-hint">drag or ← → to browse · click the front card to open</p>
        </div>

        {/* Thông tin dự án đang chọn */}
        <div data-fx="up">
          <div key={cur.id} className="pj-info" style={{ "--c": cur.color } as CSSProperties}>
            <div className="pj-info__main">
              <h3>{cur.title}</h3>
              <p>{cur.description}</p>
              <div className="pj-info__pills">{cur.tech.map(t => <span key={t}>{t}</span>)}</div>
            </div>
            <div className="pj-info__actions">
              <button className="pj-btn pj-btn--solid" onClick={() => openDetail()} data-hover>View case study →</button>
              {cur.githubUrl && <a className="pj-btn" href={cur.githubUrl} target="_blank" rel="noopener noreferrer" data-hover>GitHub ↗</a>}
              {cur.liveUrl && <a className="pj-btn" href={cur.liveUrl} target="_blank" rel="noopener noreferrer" data-hover>Live ↗</a>}
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <ProjectDetail
          project={detail.project}
          fromRect={detail.rect}
          onNavigate={navigateDetail}
          onClose={() => setDetail(null)}
        />
      )}
    </section>
  );
};

export default ProjectsSection;
