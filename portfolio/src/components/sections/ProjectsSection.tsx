/**
 * ProjectsSection.tsx
 *
 * ─── THÊM PROJECT MỚI ────────────────────────────────────────
 * Chỉ cần thêm object vào mảng PROJECTS bên dưới:
 *
 *   {
 *     id: 7,                               // tăng dần
 *     number: "07",                        // hiển thị watermark
 *     tag: "Category · Role",
 *     title: "Tên Project",
 *     description: "Mô tả ngắn...",
 *     tech: ["React", "Node.js", ...],     // tech pills
 *     color: "#hexcode",                   // màu chủ đạo — tự động áp vào toàn card
 *     teamSize: 3,
 *     image: "/images/projects/demo.png",  // đặt file vào public/images/projects/
 *                                          // bỏ trống ("") nếu chưa có ảnh → hiện placeholder đẹp
 *     githubUrl: "https://github.com/...", // bỏ nếu không có
 *     liveUrl:   "https://...",            // bỏ nếu không có
 *   },
 *
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import "../styles/projects.css";

// ─── DATA ────────────────────────────────────────────────────
interface Project {
  id: number;
  number: string;
  tag: string;
  title: string;
  description: string;
  tech: string[];
  color: string;
  hue: number;
  teamSize: number;
  image?: string;      // path tương đối từ /public — vd: "/images/projects/mommilk.png"
  githubUrl?: string;
  liveUrl?: string;
}

const PROJECTS: Project[] = [
  {
    id: 1,
    number: "01",
    tag: "E-Commerce · Front-end Dev",
    title: "MomMilk Platform",
    description:
      "E-commerce platform for baby and mom milk products. Allows users to browse and purchase infant formula, toddler milk, and nutrition supplements for mothers.",
    tech: ["ASP.NET Core", "Node.js", "Firebase", "MySQL", "Sandbox"],
    hue: 160,
    teamSize: 4,
    image: "/images/projects/mommilk.png",
    githubUrl: "https://github.com/devbaoo/Mommilk",
    color: "#39ff14",
  },
  {
    id: 2,
    number: "02",
    tag: "Mobile · Full-stack Dev",
    title: "MÔME Food Order",
    description:
      "Food ordering app for Vinhomes District 9 residents with baby health tracking: weight, height, feeding schedules, vaccination records and growth progress.",
    tech: ["Android Studio", "SQLite", "TogetherAI API", "PayOS"],
    hue: 330,
    teamSize: 2,
    image: "/images/projects/mome.png",
    liveUrl: "https://apkpure.com/mômê/com.dk.foodorder",
    color: "#ff2d78",
  },
  {
    id: 3,
    number: "03",
    tag: "SaaS · Front-end + Mobile",
    title: "Orchid Research & Lab",
    description:
      "Digital platform modernising botanical research via cloud-based management and AI-driven predictive analytics. Uses YOLOv8 to monitor and forecast orchid growth patterns.",
    tech: ["ReactJS", "React Native", "Tailwind CSS", "ASP.NET Core", "YOLOv8", "PostgreSQL"],
    hue: 200,
    teamSize: 4,
    image: "/images/projects/orchid.png",
    githubUrl: "https://github.com/orchid-lab",
    color: "#00cfff",
  },
  {
    id: 4,
    number: "04",
    tag: "AI · Full-stack Dev",
    title: "AI Chatbox",
    description:
      "Intelligent chatbot web app powered by Google Gemini API. Supports multi-turn conversations with persistent chat history stored in SQLite, backed by a Django REST API and a TypeScript front-end.",
    tech: ["Django", "TypeScript", "Gemini API", "SQLite"],
    hue: 45,
    teamSize: 1,
    image: "/images/projects/ai-chatbox.png",
    githubUrl: "https://github.com/tykyfatkie/ai-chatbox-django",
    color: "#ffd700",
  },
  {
    id: 5,
    number: "05",
    tag: "HealthTech · Full-stack Dev",
    title: "Children Vaccination System",
    description:
      "End-to-end vaccination management platform for children. Handles scheduling, reminders, and payment integration via VNPay Sandbox, built on a C# .NET back-end with a TypeScript front-end.",
    tech: ["C# .NET", "TypeScript", "VNPay Sandbox", "SQL Server"],
    hue: 270,
    teamSize: 4,
    image: "/images/projects/cvs.png",
    githubUrl: "https://github.com/PhamVietHoangFPT/ChildrenVaccinationSystem",
    color: "#a855f7",
  },
  {
    id: 6,
    number: "06",
    tag: "HealthTech · Full-stack Dev",
    title: "Child Growth Tracking",
    description:
      "Comprehensive child growth monitoring platform with Google OAuth authentication. Parents record and track weight, height, and developmental milestones, with VNPay-powered premium subscriptions.",
    tech: ["C# .NET", "TypeScript", "PostgreSQL", "Google Auth", "VNPay Sandbox"],
    hue: 190,
    teamSize: 4,
    image: "/images/projects/cgts.png",
    githubUrl: "https://github.com/tykyfatkie/Child_Growth_Tracking_System_FE",
    color: "#00e5ff",
  },
];

// ─── CARD ────────────────────────────────────────────────────
const ProjectCard = ({ p, index }: { p: Project; index: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hov, setHov]   = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current!.getBoundingClientRect();
    const dx = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    setTilt({ x: -dy * 7, y: dx * 7 });
  }, []);

  const showImage = p.image && !imgErr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={cardRef}
        className="proj-card"
        /* inject màu vào CSS custom property — toàn bộ style trong projects.css
           đều đọc từ --proj-color, không cần chỉnh CSS khi thêm project mới */
        style={{ "--proj-color": p.color } as React.CSSProperties}
        onMouseMove={onMove}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHov(false); }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y, y: hov ? -10 : 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
      >
        {/* ── Thumbnail ── */}
        <div className="proj-thumb">

          {/* Ảnh demo (nếu có) */}
          {showImage && (
            <>
              <img
                src={p.image}
                alt={`${p.title} demo`}
                className="proj-thumb__img"
                onError={() => setImgErr(true)}
              />
              <div className="proj-thumb__overlay" />
            </>
          )}

          {/* Grid SVG — chỉ hiện khi không có ảnh */}
          {!showImage && (
            <svg className="proj-thumb__grid">
              <defs>
                <pattern id={`grid-${p.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke={p.color} strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${p.id})`} />
            </svg>
          )}

          {/* Watermark số */}
          {!showImage && (
            <span className="proj-thumb__number">{p.number}</span>
          )}

          {/* Glow */}
          <div className="proj-thumb__glow" />

          {/* Bottom line */}
          <div className="proj-thumb__line" />

          {/* Badge */}
          <div className="proj-thumb__badge">Team {p.teamSize}</div>
        </div>

        {/* ── Body ── */}
        <div className="proj-body">
          <div className="proj-tag">{p.tag}</div>

          <h3 className="proj-title">{p.title}</h3>

          <p className="proj-desc">{p.description}</p>

          <div className="proj-pills">
            {p.tech.map(t => (
              <span key={t} className="proj-pill">{t}</span>
            ))}
          </div>

          <div className="proj-links">
            {p.githubUrl && (
              <a
                href={p.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="proj-link"
              >
                GitHub ↗
              </a>
            )}
            {p.liveUrl && (
              <a
                href={p.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="proj-link"
              >
                Live ↗
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── SECTION ─────────────────────────────────────────────────
const ProjectsSection = () => (
  <section id="projects" style={{ background: "var(--bg2)", padding: "8rem 2rem", minHeight: "100vh" }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ marginBottom: "5rem" }}
      >
        <p className="section-label">03 / Work</p>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.5rem, 7vw, 5rem)",
          lineHeight: 0.95,
        }}>
          SELECTED <span className="neon-green">PROJECTS</span>
        </h2>
      </motion.div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
        gap: "1.5rem",
      }}>
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.id} p={p} index={i} />
        ))}
      </div>
    </div>
  </section>
);

export default ProjectsSection;