import { useRef, useState, useCallback } from "react";
import { motion } from "motion/react";
import { Project } from "../../types";

interface ProjectCard3DProps {
  project: Project;
  index: number;
}

const ProjectCard3D = ({ project, index }: ProjectCard3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: -dy * 8, y: dx * 8 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000, cursor: "none" }}
    >
      <motion.div
        ref={cardRef}
        className="project-card"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
          translateY: hovered ? -8 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{
          background: "var(--glass)",
          border: `0.5px solid ${
            hovered ? `hsla(${project.color},80%,60%,0.35)` : "var(--glass-border)"
          }`,
          borderRadius: 12,
          overflow: "hidden",
          transformStyle: "preserve-3d",
          boxShadow: hovered
            ? `0 24px 60px rgba(0,0,0,0.5), 0 0 40px hsla(${project.color},80%,50%,0.08)`
            : "none",
          transition: "border-color 0.4s, box-shadow 0.4s",
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            height: 160,
            background: `linear-gradient(135deg, #0d1117, hsl(${project.color},25%,10%))`,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id={`grid-${project.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={`hsl(${project.color},80%,60%)`} strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${project.id})`} />
          </svg>

          <div
            style={{
              position: "absolute",
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: `radial-gradient(circle, hsla(${project.color},80%,60%,0.25) 0%, transparent 70%)`,
              top: "10%",
              right: "15%",
            }}
          />

          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "2.5rem",
              color: `hsla(${project.color},80%,70%,0.15)`,
              letterSpacing: "-0.03em",
              position: "absolute",
              bottom: 12,
              left: 16,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {project.title.split(" ")[0].toUpperCase()}
          </span>

          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, hsl(${project.color},80%,60%), transparent)`,
              opacity: hovered ? 1 : 0.3,
              transition: "opacity 0.4s",
            }}
          />
        </div>

        {/* Body */}
        <div style={{ padding: "1.25rem" }}>
          <div
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "0.65rem",
              color: `hsl(${project.color},80%,65%)`,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "0.4rem",
            }}
          >
            {project.tag}
          </div>

          <h3
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              color: "#e2e8f0",
            }}
          >
            {project.title}
          </h3>

          <p
            style={{
              fontSize: "0.8rem",
              color: "#64748b",
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            {project.description}
          </p>

          <div style={{ display: "flex", gap: "0.4rem", marginTop: "1rem", flexWrap: "wrap" }}>
            {project.tech.map((t) => (
              <span
                key={t}
                style={{
                  padding: "0.2rem 0.6rem",
                  background: `hsla(${project.color},80%,50%,0.07)`,
                  border: `0.5px solid hsla(${project.color},80%,50%,0.2)`,
                  borderRadius: 4,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.65rem",
                  color: `hsl(${project.color},70%,70%)`,
                }}
              >
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.7rem",
                  color: "#64748b",
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                  cursor: "none",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "var(--neon)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#64748b")
                }
              >
                GitHub →
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "0.7rem",
                  color: "#64748b",
                  textDecoration: "none",
                  letterSpacing: "0.05em",
                  cursor: "none",
                  transition: "color 0.3s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "var(--neon)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "#64748b")
                }
              >
                Live Demo →
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectCard3D;
