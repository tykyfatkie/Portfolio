import { useEffect } from "react";
import Navbar from "./components/ui/Navbar";
import HeroSection from "./components/sections/HeroSection";
import AboutSection from "./components/sections/AboutSection";
import SkillsSection from "./components/sections/SkillsSection";
import ProjectsSection from "./components/sections/ProjectsSection";
import ContactSection from "./components/sections/ContactSection";
import { useCursor } from "./hooks/useCursor";

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

const App = () => {
  useCursor();

  useEffect(() => {
    document.title = "Nguyễn Tăng Tài Phát · Software Engineer";
  }, []);

  return (
    <>
      {/* Cursor */}
      <div id="cursor-dot"  className="cursor-dot" />
      <div id="cursor-ring" className="cursor-ring" />

      {/* Noise */}
      <div className="noise" />

      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
};

export default App;
