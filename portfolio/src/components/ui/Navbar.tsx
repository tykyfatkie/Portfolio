import { motion } from "motion/react";
import { useDeck } from "./SlideDeck";
import AudioWave from "./AudioWave";

const NAV = [
  { label: "About",    href: "#about" },
  { label: "Skills",   href: "#skills" },
  { label: "Work",     href: "#projects" },
  { label: "Contact",  href: "#contact" },
];

const Navbar = () => {
  const { index, ids } = useDeck();
  const scrolled = index > 0;
  const active   = index > 0 ? ids[index] : "";

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: .7, ease: [.16,1,.3,1] }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        padding: "1.1rem 2.5rem",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "0.5px solid rgba(57,255,20,0.08)" : "none",
        transition: "all .4s ease",
      }}
    >
      {/* Logo */}
      <a href="#hero" style={{ textDecoration: "none" }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.4rem",
          letterSpacing: ".1em",
          color: "var(--neon)",
          textShadow: "0 0 16px rgba(57,255,20,0.5)",
        }}>TYPHAT.DEV</span>
      </a>

      {/* Links */}
      <div style={{ display: "flex", gap: "2.5rem", alignItems: "center" }}>
        {NAV.map(link => (
          <a
            key={link.href}
            href={link.href}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: ".72rem",
              letterSpacing: ".12em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: active === link.href.slice(1) ? "var(--neon)" : "var(--muted)",
              transition: "color .3s",
              position: "relative",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--neon)")}
            onMouseLeave={e => (e.currentTarget.style.color = active === link.href.slice(1) ? "var(--neon)" : "var(--muted)")}
          >
            {link.label}
            {active === link.href.slice(1) && (
              <motion.span
                layoutId="nav-indicator"
                style={{
                  position: "absolute", bottom: -6, left: 0, right: 0,
                  height: 1, background: "var(--neon)",
                  boxShadow: "0 0 8px var(--neon)",
                }}
              />
            )}
          </a>
        ))}
        <button className="kbd-hint" data-hover onClick={() => window.dispatchEvent(new Event("app:palette"))} title="Command palette">
          <kbd>{/Mac/i.test(navigator.platform) ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd>
        </button>
        <AudioWave />
        <a
          href="#contact"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: ".72rem",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            textDecoration: "none",
            padding: ".45rem 1.1rem",
            border: "1px solid var(--neon)",
            borderRadius: 3,
            color: "var(--neon)",
            transition: "all .3s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "var(--neon)";
            e.currentTarget.style.color = "#000";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--neon)";
          }}
        >
          Hire Me
        </a>
      </div>
    </motion.nav>
  );
};

export default Navbar;
