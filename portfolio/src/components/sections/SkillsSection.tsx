import { lazy, Suspense, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
const TechGlobe = lazy(() => import("../3d/TechGlobe"));
import ScrambleText from "../ui/ScrambleText";
import Backdrop from "../3d/Backdrops";

const SKILL_GROUPS = [
  {
    category: "Front-end",
    color: "var(--neon)",
    skills: [
      { name: "ReactJS / TypeScript", level: 85 },
      { name: "Flutter (Dart)",        level: 70 },
      { name: "React Native",         level: 75 },
      { name: "Angular",              level: 60 },
      { name: "TailwindCSS",          level: 90 },
      { name: "Ant Design / Bootstrap", level: 80 },
    ],
  },
  {
    category: "Back-end",
    color: "var(--neon2)",
    skills: [
      { name: "NestJS (Node.js)",  level: 78 },
      { name: "PHP",               level: 72 },
      { name: "ASP.NET Core (C#)", level: 70 },
      { name: "Django (Python)",   level: 65 },
      { name: "Node.js",           level: 70 },
      { name: "REST APIs",         level: 80 },
    ],
  },
  {
    category: "Databases",
    color: "var(--neon3)",
    skills: [
      { name: "MariaDB / MySQL",    level: 78 },
      { name: "PostgreSQL",         level: 72 },
      { name: "SQLite",             level: 70 },
      { name: "Firebase / Supabase",level: 72 },
    ],
  },
  {
    category: "Tools & Others",
    color: "var(--gold)",
    skills: [
      { name: "Git / GitHub / GitLab", level: 85 },
      { name: "Docker / Redis",        level: 60 },
      { name: "Vite / npm / Yarn",     level: 80 },
      { name: "Axios / Zustand",       level: 75 },
    ],
  },
];

const CERTIFICATIONS = [
  "Basics of Web Development & Coding Specialization",
  "Software Development Lifecycle",
  "Project Management Principles and Practices",
  "IELTS Certificate 6.0",
];

const SkillBar = ({ name, level, color }: { name: string; level: number; color: string }) => {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      gsap.fromTo(el, { scaleX: 0 }, { scaleX: level / 100, duration: 1.2, ease: "expo.out", delay: .1 });
    }, { threshold: .5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [level]);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: ".4rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "#aaa" }}>{name}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: ".65rem", color: color }}>{level}%</span>
      </div>
      <div style={{ height: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1 }}>
        <div
          ref={barRef}
          style={{
            height: "100%",
            background: `linear-gradient(90deg, ${color}, transparent)`,
            borderRadius: 1,
            transformOrigin: "left",
            transform: "scaleX(0)",
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
};

const MARQUEE_SKILLS = [
  "ReactJS","TypeScript","React Native","Angular","TailwindCSS","ASP.NET Core",
  "Django","Python","C#","Node.js","NestJS","PHP","Flutter","MariaDB","MySQL","PostgreSQL","Firebase","Supabase",
  "Docker","Redis","Git","Vite","Zustand","YOLOv8","Android Studio","Figma",
];

const SkillsSection = () => (
  <section id="skills" style={{ background: "var(--bg)", padding: "8rem 0", minHeight: "100vh", overflow: "hidden" }}>
    <Backdrop kind="ribbon" opacity={0.55} />
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 2rem", position: "relative", zIndex: 1 }}>

      <motion.div data-fx="up"
        style={{ marginBottom: "5rem" }}
      >
        <p className="section-label">02 / Skills</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: .95 }}>
          TECH <ScrambleText text="STACK" className="neon-pink" />
        </h2>
        <span className="title-underline" />
      </motion.div>

      {/* Quả cầu 3D — kéo để xoay */}
      <motion.div data-fx="zoom"
        style={{ marginBottom: "4rem", position: "relative" }}
      >
        <Suspense fallback={<div style={{ height: "min(520px, 80vw)" }} />}><TechGlobe /></Suspense>
        <p style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: ".62rem", letterSpacing: ".2em", color: "var(--muted)", textTransform: "uppercase" }}>
          ◐ drag to rotate
        </p>
      </motion.div>

      {/* Skill bars grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem 4rem", marginBottom: "5rem" }}>
        {SKILL_GROUPS.map((group, gi) => (
          <motion.div data-fx="up"
            key={group.category}
          >
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.5rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: group.color, boxShadow: `0 0 12px ${group.color}` }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: ".7rem", color: group.color, letterSpacing: ".15em", textTransform: "uppercase" }}>{group.category}</span>
            </div>
            {group.skills.map(s => (
              <SkillBar key={s.name} name={s.name} level={s.level} color={group.color} />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Certs */}
      <motion.div data-fx="up"
        style={{
          background: "var(--glass)",
          border: "0.5px solid var(--glass-border)",
          borderRadius: 12,
          padding: "2rem",
          marginBottom: "5rem",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: ".65rem", color: "var(--neon)", letterSpacing: ".2em", textTransform: "uppercase", marginBottom: "1.25rem" }}>
          Certifications & Licenses
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem" }}>
          {CERTIFICATIONS.map(cert => (
            <span
              key={cert}
              style={{
                padding: ".35rem .9rem",
                background: "rgba(57,255,20,0.05)",
                border: "0.5px solid rgba(57,255,20,0.2)",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                fontSize: ".68rem",
                color: "var(--neon)",
              }}
            >
              {cert}
            </span>
          ))}
        </div>
      </motion.div>
    </div>

    {/* Marquee */}
    <div data-fx="fade" style={{ position: "relative", zIndex: 1, overflow: "hidden", borderTop: "0.5px solid var(--glass-border)", borderBottom: "0.5px solid var(--glass-border)", padding: "1rem 0" }}>
      <div className="marquee-track">
        {[...MARQUEE_SKILLS, ...MARQUEE_SKILLS].map((s, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
              letterSpacing: ".15em",
              color: i % 5 === 0 ? "var(--neon)" : i % 5 === 2 ? "var(--neon2)" : "#333",
              marginRight: "3rem",
              whiteSpace: "nowrap",
            }}
          >
            {s} /
          </span>
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

export default SkillsSection;
