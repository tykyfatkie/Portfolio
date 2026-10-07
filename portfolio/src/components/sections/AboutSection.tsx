import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { lazy, Suspense } from "react";
import Tilt from "../ui/Tilt";
import ScrambleText from "../ui/ScrambleText";
import ProfileCard3D from "../ui/ProfileCard3D";
import Backdrop from "../3d/Backdrops";

const CommitCity = lazy(() => import("../3d/CommitCity"));

const STATS = [
  { value: "3+",   label: "Years Learning",    icon: "📅" },
  { value: "3",    label: "Projects Shipped",  icon: "🚀" },
  { value: "6.0",  label: "IELTS Score",       icon: "🌐" },
  { value: "∞",    label: "Curiosity Level",   icon: "🔥" },
];

const CONTACTS = [
  ["📧", "gg.fctaiphat@yahoo.com"],
  ["📍", "Tan Phu, Ho Chi Minh City"],
  ["📞", "0932 000 035"],
];

const TIMELINE = [
  {
    period: "Present",
    title: "Backend Developer",
    org: "DIGIPAY JSC",
    desc: "Building and maintaining backend services and APIs with NestJS, PHP and MariaDB.",
    color: "var(--neon3)",
    now: true,
  },
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

const strong: CSSProperties = { color: "var(--text)", fontWeight: 500 };

const AboutSection = () => (
  <section id="about" style={{ background: "var(--bg2)", padding: "8rem 2rem 6rem", minHeight: "100vh" }}>
    <Backdrop kind="dots" opacity={0.45} />

    <div className="about-wrap">

      {/* Header */}
      <div data-fx="up" style={{ marginBottom: "4rem" }}>
        <p className="section-label">01 / About</p>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: .95, letterSpacing: ".02em" }}>
          WHO I <ScrambleText text="AM" className="neon-green" />
        </h2>
        <span className="title-underline" />
      </div>

      <div className="about-grid">

        {/* Trái: thẻ hồ sơ 3D */}
        <div data-fx="zoom" className="about-left">
          <ProfileCard3D />
        </div>

        {/* Phải: giới thiệu + thống kê + liên hệ */}
        <div className="about-right">
          <p data-fx="right" className="about-lead">
            I turn ideas into <em className="hl hl--green">reliable backends</em>,{" "}
            <em className="hl hl--pink">polished mobile apps</em> and{" "}
            <em className="hl hl--cyan">immersive web experiences</em>.
          </p>

          <div data-fx="right" className="about-bio">
            <p>
              I'm <strong style={strong}>Nguyễn Tăng Tài Phát</strong> — a backend developer at{" "}
              <strong style={strong}>DIGIPAY JSC</strong> and software engineering student based in{" "}
              <strong style={{ color: "var(--neon)" }}>Ho Chi Minh City</strong>, Vietnam.
            </p>
            <p>
              I have a versatile background in both <strong style={strong}>Front-end (ReactJS)</strong> and{" "}
              <strong style={strong}>Back-end (NestJS, PHP, ASP.NET Core, Django)</strong> development, plus{" "}
              <strong style={strong}>Mobile (Flutter, React Native)</strong>, with hands-on experience integrating AI models into web applications.
            </p>
            <p>
              As a continuous learner, I keep expanding my expertise through real-world projects — from production backends to side projects with AI and 3D on the web.
            </p>
          </div>

          <div className="about-stats">
            {STATS.map(s => (
              <div key={s.label} data-fx="zoom">
                <Tilt className="stat-card" max={16}>
                  <div style={{ fontSize: "1.3rem", marginBottom: ".2rem", transform: "translateZ(30px)" }}>{s.icon}</div>
                  <div className="count-num"><CountUp target={s.value} /></div>
                  <div className="stat-label">{s.label}</div>
                </Tilt>
              </div>
            ))}
          </div>

          <div data-fx="up" className="about-contacts">
            {CONTACTS.map(([icon, text]) => (
              <span key={text} className="contact-pill"><span>{icon}</span>{text}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Hành trình: thẻ 3D xếp thành hàng */}
      <div data-fx="up" className="about-journey-head">
        <span className="section-label" style={{ margin: 0 }}>Journey</span>
        <span className="about-journey-line" />
      </div>

      <div className="about-timeline">
        {TIMELINE.map((item, i) => (
          <div key={item.title} data-fx="up" style={{ "--c": item.color } as CSSProperties}>
            <Tilt className="tl-card" max={10}>
              <span className="tl-index">{String(i + 1).padStart(2, "0")}</span>
              <div className="tl-top">
                <span className="tl-period">{item.period}</span>
                {item.now && <span className="tl-now"><i />NOW</span>}
              </div>
              <div className="tl-title">{item.title}</div>
              <div className="tl-org">{item.org}</div>
              <p className="tl-desc">{item.desc}</p>
              <span className="tl-bar" />
            </Tilt>
          </div>
        ))}
      </div>

      {/* Hoạt động GitHub: thành phố commit 3D từ dữ liệu thật */}
      <div data-fx="up" className="about-journey-head" style={{ marginTop: "5rem" }}>
        <span className="section-label" style={{ margin: 0 }}>Commit city</span>
        <span className="about-journey-line" />
      </div>
      <div data-fx="zoom">
        <Suspense fallback={<div className="cc__canvas" />}><CommitCity /></Suspense>
      </div>
    </div>
  </section>
);

export default AboutSection;
