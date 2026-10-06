import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { gsap } from "gsap";
import { WarpFieldBackground } from "@designcodeio/threeui/components/WarpFieldBackground";

const ROLES = ["Software Engineer", "Front-end Developer", "Full-stack Builder", "AI Integrator"];

const HeroSection = () => {
  const roleRef  = useRef<HTMLSpanElement>(null);
  const nameRef  = useRef<HTMLHeadingElement>(null);
  const lineRef  = useRef<HTMLDivElement>(null);

  // Typewriter role cycling
  useEffect(() => {
    const el = roleRef.current;
    if (!el) return;
    let idx = 0, charIdx = 0, deleting = false, raf = 0;

    const tick = () => {
      const word = ROLES[idx];
      if (!deleting) {
        el.textContent = word.slice(0, ++charIdx);
        if (charIdx === word.length) { deleting = true; raf = window.setTimeout(tick, 1800) as unknown as number; return; }
      } else {
        el.textContent = word.slice(0, --charIdx);
        if (charIdx === 0) { deleting = false; idx = (idx + 1) % ROLES.length; }
      }
      raf = window.setTimeout(tick, deleting ? 45 : 80) as unknown as number;
    };
    raf = window.setTimeout(tick, 600) as unknown as number;
    return () => clearTimeout(raf);
  }, []);

  // GSAP entrance for name letters
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 60, skewY: 4 }, { opacity: 1, y: 0, skewY: 0, duration: 1, ease: "expo.out", delay: .3 });
  }, []);

  // GSAP line reveal
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "expo.out", delay: .8, transformOrigin: "left" });
  }, []);

  return (
    <section
      id="hero"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "var(--bg)",
      }}
    >
      {/* Warp field background (ThreeUI) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <WarpFieldBackground variant="streaks" speed={8} streakOpacity={0.55} brightness={0.9} />
      </div>

      {/* Vignette giữ chữ dễ đọc */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.2) 45%, var(--bg) 100%)",
      }} />

      {/* Gradient blobs */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(57,255,20,0.06) 0%, transparent 70%)",
          top: "10%", left: "5%",
        }} />
        <div style={{
          position: "absolute", width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,45,120,0.05) 0%, transparent 70%)",
          bottom: "15%", right: "8%",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "2rem", maxWidth: 900, width: "100%" }}>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .6, delay: .1 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: ".72rem",
            letterSpacing: ".25em",
            textTransform: "uppercase",
            color: "var(--neon)",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: ".75rem",
          }}
        >
          <span style={{ display: "inline-block", width: 32, height: 1, background: "var(--neon)" }} />
          Available for opportunities · 2025
          <span style={{ display: "inline-block", width: 32, height: 1, background: "var(--neon)" }} />
        </motion.div>

        {/* Name */}
        <h1
          ref={nameRef}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(3.5rem, 13vw, 10rem)",
            letterSpacing: "-.01em",
            lineHeight: .9,
            marginBottom: "1rem",
            opacity: 0,
          }}
        >
          <span className="glitch-wrap" data-text="NGUYEN">NGUYEN</span>
          <br />
          <span style={{ color: "var(--neon)", textShadow: "0 0 40px rgba(57,255,20,0.4)" }}>TANG TAI</span>
          <br />
          PHAT
        </h1>

        {/* Divider line */}
        <div
          ref={lineRef}
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, var(--neon), transparent)",
            margin: "1.5rem auto",
            maxWidth: 400,
            transformOrigin: "left",
          }}
        />

        {/* Role typewriter */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: .7 }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "clamp(.9rem, 2.5vw, 1.3rem)",
            color: "var(--muted)",
            marginBottom: "2.5rem",
            letterSpacing: ".05em",
          }}
        >
          {"// "}
          <span ref={roleRef} style={{ color: "var(--neon3)" }} />
          <span style={{ animation: "blink 1s step-end infinite", color: "var(--neon3)" }}>|</span>
        </motion.p>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: .9 }}
          style={{
            fontSize: "clamp(.85rem, 1.8vw, 1rem)",
            color: "#666",
            maxWidth: 520,
            margin: "0 auto 3rem",
            lineHeight: 1.9,
            fontWeight: 300,
          }}
        >
          FPT University student passionate about crafting immersive web experiences,
          integrating AI, and building products that actually matter.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}
        >
          <a
            href="#projects"
            style={{
              padding: ".85rem 2.2rem",
              background: "var(--neon)",
              color: "#000",
              borderRadius: 3,
              fontFamily: "var(--font-mono)",
              fontSize: ".78rem",
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "all .3s",
              display: "inline-block",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 12px 40px rgba(57,255,20,0.4)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = "";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "";
            }}
          >
            View Projects
          </a>
          <a
            href="https://github.com/tykyfatkie"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: ".85rem 2.2rem",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ccc",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(8px)",
              borderRadius: 3,
              fontFamily: "var(--font-mono)",
              fontSize: ".78rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "all .3s",
              display: "inline-block",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--neon)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--neon)";
              (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLAnchorElement).style.color = "#ccc";
              (e.currentTarget as HTMLAnchorElement).style.transform = "";
            }}
          >
            GitHub ↗
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: ".5rem",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: ".55rem", letterSpacing: ".25em", color: "var(--muted)", textTransform: "uppercase" }}>scroll</span>
          <div className="scroll-line" />
        </motion.div>
      </div>

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </section>
  );
};

export default HeroSection;
