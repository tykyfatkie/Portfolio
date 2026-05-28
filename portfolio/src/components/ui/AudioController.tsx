/**
 * AudioController — floating button to toggle background music.
 * Shows a pulsing waveform icon when playing.
 */
import { useBackgroundMusic } from "../../hooks/useBackgroundMusic";

const WaveIcon = ({ active }: { active: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    {[3, 6, 9, 12, 15, 18].map((x, i) => {
      const heights = active
        ? [4, 10, 14, 12, 8, 4]
        : [2, 2, 2, 2, 2, 2];
      const h = heights[i];
      return (
        <rect
          key={x}
          x={x - 1}
          y={10 - h / 2}
          width={2}
          height={h}
          rx={1}
          fill="currentColor"
          style={active ? {
            animation: `wave-bar ${0.6 + i * 0.1}s ease-in-out infinite alternate`,
          } : undefined}
        />
      );
    })}
    <style>{`
      @keyframes wave-bar {
        from { transform: scaleY(0.4); }
        to   { transform: scaleY(1.4); }
      }
    `}</style>
  </svg>
);

const MuteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="9" width="2" height="2" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="5" y="8" width="2" height="4" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="8" y="7" width="2" height="6" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="11" y="8" width="2" height="4" rx="1" fill="currentColor" opacity="0.4"/>
    <rect x="14" y="9" width="2" height="2" rx="1" fill="currentColor" opacity="0.4"/>
    <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

export default function AudioController() {
  const { playing, ready, toggle } = useBackgroundMusic();

  return (
    <button
      onClick={toggle}
      title={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
      data-hover
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 1000,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: playing
          ? "rgba(57,255,20,0.12)"
          : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${playing ? "rgba(57,255,20,0.5)" : "rgba(255,255,255,0.1)"}`,
        backdropFilter: "blur(12px)",
        color: playing ? "var(--neon)" : "#555",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "none",
        transition: "all 0.3s ease",
        boxShadow: playing
          ? "0 0 20px rgba(57,255,20,0.2), 0 0 40px rgba(57,255,20,0.08)"
          : "none",
        opacity: ready ? 1 : 0.5,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1.1)";
        el.style.boxShadow = playing
          ? "0 0 30px rgba(57,255,20,0.35), 0 0 60px rgba(57,255,20,0.12)"
          : "0 0 20px rgba(255,255,255,0.05)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.transform = "scale(1)";
        el.style.boxShadow = playing
          ? "0 0 20px rgba(57,255,20,0.2), 0 0 40px rgba(57,255,20,0.08)"
          : "none";
      }}
    >
      {playing ? <WaveIcon active={true} /> : <MuteIcon />}
    </button>
  );
}
