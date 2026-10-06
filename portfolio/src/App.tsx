import { useCallback, useEffect, useState } from "react";
import Navbar from "./components/ui/Navbar";
import HeroSection from "./components/sections/HeroSection";
import AboutSection from "./components/sections/AboutSection";
import SkillsSection from "./components/sections/SkillsSection";
import ProjectsSection from "./components/sections/ProjectsSection";
import ContactSection from "./components/sections/ContactSection";
import AudioController from "./components/ui/AudioController";
import ScrollProgress from "./components/ui/ScrollProgress";
import Preloader from "./components/ui/Preloader";
import CommandPalette from "./components/ui/CommandPalette";
import { DeckProvider, SlideDeck } from "./components/ui/SlideDeck";

const SLIDE_IDS    = ["hero", "about", "skills", "projects", "contact"];
const SLIDE_LABELS = ["Home", "About", "Skills", "Work", "Contact"];
import { useCursor } from "./hooks/useCursor";
import { startMusic } from "./lib/music";
import { bootAudio } from "./hooks/useSound";

const Footer = () => (
  <footer style={{
    background: "var(--bg2)",
    borderTop: "0.5px solid rgba(57,255,20,0.06)",
    padding: "2rem",
    textAlign: "center",
    fontFamily: "var(--font-mono)",
    fontSize: ".68rem",
    color: "#333",
    letterSpacing: ".08em",
  }}>
    <span style={{ color: "var(--neon)" }}>TYPHAT.DEV</span>
    {" · "}
    Built with React + GSAP + Three.js
    {" · "}
    <span style={{ color: "var(--neon)" }}>{new Date().getFullYear()}</span>
  </footer>
);

// ── Hộp thông báo ────────────────────────────────────────────────────────────
const ClickPrompt = ({ visible }: { visible: boolean }) => (
  <div style={{
    position: "fixed",
    bottom: "2rem",
    left: "50%",
    transform: `translateX(-50%) translateY(${visible ? 0 : "20px"})`,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.5s ease, transform 0.5s ease",
    pointerEvents: "none",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    background: "rgba(10,10,10,0.85)",
    border: "1px solid rgba(57,255,20,0.25)",
    backdropFilter: "blur(16px)",
    borderRadius: "999px",
    padding: "0.6rem 1.4rem",
    fontFamily: "var(--font-mono)",
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: "0.08em",
    boxShadow: "0 0 24px rgba(57,255,20,0.08)",
    whiteSpace: "nowrap",
  }}>
    {/* Icon sóng âm nhỏ */}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <style>{`
        @keyframes w1{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
        @keyframes w2{0%,100%{transform:scaleY(.8)}50%{transform:scaleY(.2)}}
        @keyframes w3{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1.1)}}
      `}</style>
      {[
        { x: 1,  h: 6,  an: "w1", dur: ".7s" },
        { x: 5,  h: 10, an: "w2", dur: ".9s" },
        { x: 9,  h: 14, an: "w3", dur: ".6s" },
        { x: 13, h: 8,  an: "w1", dur: ".8s" },
      ].map(({ x, h, an, dur }) => (
        <rect
          key={x} x={x} y={(16 - h) / 2} width="2" height={h} rx="1"
          fill="rgba(57,255,20,0.8)"
          style={{ transformOrigin: `${x + 1}px 8px`, animation: `${an} ${dur} ease-in-out infinite` }}
        />
      ))}
    </svg>

    Click anywhere on the screen to get the full experience!

    {/* Dot nhấp nháy */}
    <span style={{
      width: 6, height: 6, borderRadius: "50%",
      background: "rgba(57,255,20,0.9)",
      display: "inline-block",
      animation: "w2 1s ease-in-out infinite",
    }} />
  </div>
);

const Main = () => {
  useCursor();
  const [prompted, setPrompted] = useState(true); // hiện ngay khi load

  useEffect(() => {
    document.title = "Nguyễn Tăng Tài Phát · Software Engineer";
  }, []);

  useEffect(() => {
    const onFirstInteraction = () => {
      bootAudio();
      startMusic(); // chỉ bật, không đảo trạng thái
      setPrompted(false); // ẩn hộp thông báo
      window.removeEventListener("click", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
    };

    window.addEventListener("click", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);
    window.addEventListener("scroll", onFirstInteraction);

    return () => {
      window.removeEventListener("click", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
      window.removeEventListener("scroll", onFirstInteraction);
    };
  }, []);

  return (
    <DeckProvider ids={SLIDE_IDS} labels={SLIDE_LABELS}>
      <div id="cursor-dot"  className="cursor-dot" />
      <div id="cursor-ring" className="cursor-ring" />
      <div className="noise" />
      <ScrollProgress />
      <Navbar />
      <SlideDeck>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <>
          <ContactSection />
          <Footer />
        </>
      </SlideDeck>
      <CommandPalette />
      <ClickPrompt visible={prompted} />
    </DeckProvider>
  );
};

const App = () => {
  const [ready, setReady]   = useState(false); // trang chính đã mount
  const [loading, setLoading] = useState(true); // màn hình loading còn hiện
  const onReady = useCallback(() => setReady(true), []);
  const onDone  = useCallback(() => setLoading(false), []);

  return (
    <>
      {ready && <Main />}
      {loading && <Preloader onReady={onReady} onDone={onDone} />}
    </>
  );
};

export default App;
