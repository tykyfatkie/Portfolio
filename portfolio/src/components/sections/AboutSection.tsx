import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";

const STATS = [
  { value: "3+",   label: "Years Learning",    icon: "📅" },
  { value: "3",    label: "Projects Shipped",  icon: "🚀" },
  { value: "6.0",  label: "IELTS Score",       icon: "🌐" },
  { value: "∞",    label: "Curiosity Level",   icon: "🔥" },
];

const TIMELINE = [
  {
    period: "Fall 2022 – Now",
    title: "Bachelor of Software Engineering",
    org: "FPT University",
    desc: "Studying core CS fundamentals, software architecture, and modern development practices.",
    color: "var(--neon)",
  },
  {
    period: "Sep 2024 – Dec 2024",
    title: "Software Engineer Fresher",
    org: "General Era Digital Solution JSC",
    desc: "Supported software development tasks including coding, testing, debugging, and implementing new features to improve system performance.",
    color: "var(--neon2)",
  },
];

const CountUp = ({ target, suffix = "" }: { target: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const num = parseFloat(target);
    if (isNaN(num)) { el.textContent = target; return; }
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const obj = { val: 0 };
      gsap.to(obj, {
        val: num, duration: 1.8, ease: "power2.out",
        onUpdate: () => { el.textContent = (Number.isInteger(num) ? Math.round(obj.val) : obj.val.toFixed(1)) + suffix; },
      });
    }, { threshold: .5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, suffix]);
  return <span ref={ref}>{target}{suffix}</span>;
};

const AboutSection = () => {
  return (
    <section id="about" style={{ background: "var(--bg2)", padding: "8rem 2rem", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ marginBottom: "5rem" }}
        >
          <p className="section-label">01 / About</p>
          <h2 style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(2.5rem, 7vw, 5rem)",
            lineHeight: .95,
            letterSpacing: ".02em",
          }}>
            WHO I <span className="neon-green">AM</span>
          </h2>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "start" }}>

          {/* Left – Bio */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .8 }}
          >
            <p style={{ color: "#888", lineHeight: 1.95, fontSize: ".95rem", fontWeight: 300, marginBottom: "1.5rem" }}>
              I'm <strong style={{ color: "var(--text)", fontWeight: 500 }}>Nguyễn Tăng Tài Phát</strong> — an adaptable software engineering student based in 
              <strong style={{ color: "var(--neon)" }}> Ho Chi Minh City</strong>, Vietnam.
            </p>
            <p style={{ color: "#888", lineHeight: 1.95, fontSize: ".95rem", fontWeight: 300, marginBottom: "1.5rem" }}>
              I have a versatile background in both <strong style={{ color: "var(--text)" }}>Front-end (ReactJS)</strong> and <strong style={{ color: "var(--text)" }}>Back-end (ASP.NET Core, Django)</strong> development, 
              with hands-on experience integrating AI models into web applications.
            </p>
            <p style={{ color: "#888", lineHeight: 1.95, fontSize: ".95rem", fontWeight: 300 }}>
              As a continuous learner, I'm eager to join a professional environment where I can contribute 
              my foundational skills while actively expanding my expertise through real-world projects.
            </p>

            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              {[
                ["📧", "gg.fctaiphat@yahoo.com"],
                ["📍", "Tan Phu, Ho Chi Minh City"],
                ["📞", "0932 000 035"],
              ].map(([icon, text]) => (
                <div key={text} style={{
                  display: "flex", alignItems: "center", gap: ".5rem",
                  fontFamily: "var(--font-mono)", fontSize: ".7rem", color: "var(--muted)",
                }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right – Stats + Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .8 }}
          >
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "3rem" }}>
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * .1 }}
                  style={{
                    background: "var(--glass)",
                    border: "0.5px solid var(--glass-border)",
                    borderRadius: 8,
                    padding: "1.25rem",
                    transition: "all .3s",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(57,255,20,0.3)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(57,255,20,0.04)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--glass-border)";
                    (e.currentTarget as HTMLElement).style.background = "var(--glass)";
                  }}
                >
                  <div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>{s.icon}</div>
                  <div className="count-num"><CountUp target={s.value} /></div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: ".62rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: ".25rem" }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Timeline */}
            <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
              <div className="timeline-line" />
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: .15 + i * .15 }}
                  style={{ marginBottom: "2rem", position: "relative" }}
                >
                  <div className="timeline-dot" style={{ background: item.color, boxShadow: `0 0 12px ${item.color}` }} />
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: ".63rem", color: item.color, letterSpacing: ".1em", marginBottom: ".3rem" }}>{item.period}</div>
                  <div style={{ fontWeight: 500, fontSize: ".95rem", color: "var(--text)", marginBottom: ".2rem" }}>{item.title}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: ".72rem", color: "var(--muted)", marginBottom: ".5rem" }}>{item.org}</div>
                  <p style={{ fontSize: ".82rem", color: "#666", lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
