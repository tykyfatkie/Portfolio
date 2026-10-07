import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import ScrambleText from "../ui/ScrambleText";
import Tilt from "../ui/Tilt";
import Defer from "../ui/Defer";
import Backdrop from "../3d/Backdrops";
import { SKILL_GROUPS, GLOBE_LABELS, type SkillGroup } from "../../data/skills";

const TechGlobe = lazy(() => import("../3d/TechGlobe"));

const CERTIFICATIONS = [
  "Basics of Web Development & Coding Specialization",
  "Software Development Lifecycle",
  "Project Management Principles and Practices",
  "IELTS Certificate 6.0",
];

const MARQUEE_SKILLS = [
  "ReactJS", "TypeScript", "Flutter", "React Native", "Angular", "TailwindCSS", "NestJS", "PHP", "ASP.NET Core",
  "Django", "Python", "C#", "Node.js", "MariaDB", "MySQL", "PostgreSQL", "Firebase", "Supabase",
  "Docker", "Redis", "Git", "Vite", "Zustand", "YOLOv8", "Android Studio", "Figma",
];

const TOTAL_SKILLS = SKILL_GROUPS.reduce((n, g) => n + g.skills.length, 0);

/** Vòng đo tròn: cung chạy tới mức kỹ năng, số đếm lên cùng lúc khi cuộn tới. */
const Ring = ({ level, color }: { level: number; color: string }) => {
  const arc = useRef<SVGCircleElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const R = 19, C = 2 * Math.PI * R;

  useEffect(() => {
    const a = arc.current, n = num.current;
    if (!a || !n) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const o = { v: 0 };
      gsap.to(o, {
        v: level, duration: 1.6, ease: "power3.out", delay: 0.4,
        onUpdate: () => { a.style.strokeDashoffset = String(C * (1 - o.v / 100)); n.textContent = String(Math.round(o.v)); },
      });
    }, { threshold: 0.4 });
    obs.observe(a);
    return () => obs.disconnect();
  }, [level, C]);

  return (
    <span className="sring" style={{ "--c": color } as CSSProperties}>
      <svg viewBox="0 0 48 48" width="46" height="46">
        <circle cx="24" cy="24" r={R} className="sring__bg" />
        <circle ref={arc} cx="24" cy="24" r={R} className="sring__arc" strokeDasharray={C} strokeDashoffset={C} />
      </svg>
      <span ref={num} className="sring__num">0</span>
    </span>
  );
};

interface PanelProps {
  group: SkillGroup;
  index: number;
  onHover: (id: string | null) => void;
}

const Panel = ({ group, index, onHover }: PanelProps) => (
  <div
    data-fx="right"
    onMouseEnter={() => onHover(group.id)}
    onMouseLeave={() => onHover(null)}
    style={{ "--c": group.color } as CSSProperties}
  >
    <Tilt className="skill-panel" max={6}>
      <div className="skill-panel__head">
        <span className="skill-panel__idx">{String(index + 1).padStart(2, "0")}</span>
        <span className="skill-panel__title">{group.category}</span>
        <span className="skill-panel__count">{group.skills.length} skills</span>
      </div>
      <div className="skill-panel__grid">
        {group.skills.map(s => (
          <div key={s.name} className="skill-item">
            <Ring level={s.level} color={group.color} />
            <span className="skill-item__name">{s.name}</span>
          </div>
        ))}
      </div>
    </Tilt>
  </div>
);

const SkillsSection = () => {
  const [active, setActive] = useState<string | null>(null);

  return (
    <section id="skills" style={{ background: "var(--bg)", padding: "8rem 0 0", minHeight: "100vh", overflow: "hidden" }}>
      <Backdrop kind="ribbon" opacity={0.5} />

      <div className="skills-wrap">
        {/* Header */}
        <div data-fx="up" className="skills-head">
          <div>
            <p className="section-label">02 / Skills</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: .95 }}>
              TECH <ScrambleText text="STACK" className="neon-pink" />
            </h2>
            <span className="title-underline" />
          </div>
          <div className="skills-meta">
            <span><b>{GLOBE_LABELS.length}</b> technologies</span>
            <span><b>{SKILL_GROUPS.length}</b> domains</span>
            <span><b>{TOTAL_SKILLS}</b> skill sets</span>
          </div>
        </div>

        <div className="skills-main">
          {/* Quả cầu: nhãn tô màu theo nhóm, sáng lên khi rê chuột vào nhóm tương ứng */}
          <div data-fx="zoom" className="skills-globe">
            <Defer ms={1100} fallback={<div style={{ height: "min(640px, 92vw)" }} />}>
              <Suspense fallback={<div style={{ height: "min(640px, 92vw)" }} />}>
                <TechGlobe active={active} />
              </Suspense>
            </Defer>
            <div className="skills-legend">
              {SKILL_GROUPS.map(g => (
                <button
                  key={g.id}
                  className={`legend-chip${active === g.id ? " is-active" : ""}`}
                  style={{ "--c": g.color } as CSSProperties}
                  onMouseEnter={() => setActive(g.id)}
                  onMouseLeave={() => setActive(null)}
                  data-hover
                >
                  <i />{g.category}
                </button>
              ))}
            </div>
            <p className="skills-hint">◐ drag to rotate · hover a domain to light it up</p>
          </div>

          {/* Bốn nhóm kỹ năng với vòng đo */}
          <div className="skills-panels">
            {SKILL_GROUPS.map((g, i) => <Panel key={g.id} group={g} index={i} onHover={setActive} />)}
          </div>
        </div>

        {/* Chứng chỉ */}
        <div data-fx="up" className="skills-certs">
          <p className="skills-certs__label">Certifications & Licenses</p>
          <div className="skills-certs__list">
            {CERTIFICATIONS.map(c => (
              <span key={c} className="cert-badge"><i>✓</i>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Marquee hai hàng ngược chiều */}
      <div data-fx="fade" className="skills-marquee">
        <div className="marquee-track">
          {[...MARQUEE_SKILLS, ...MARQUEE_SKILLS].map((s, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-display)", fontSize: "1.2rem", letterSpacing: ".15em",
                color: i % 5 === 0 ? "var(--neon)" : i % 5 === 2 ? "var(--neon2)" : "#333",
                marginRight: "3rem", whiteSpace: "nowrap",
              }}
            >{s} /</span>
          ))}
        </div>
        <div className="marquee-track reverse" style={{ marginTop: ".5rem" }}>
          {[...MARQUEE_SKILLS, ...MARQUEE_SKILLS].reverse().map((s, i) => (
            <span key={i} className="marquee-outline">{s}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsSection;
