import { useBackgroundMusic } from "../../hooks/useBackgroundMusic";
import { bootAudio } from "../../hooks/useSound";

export default function AudioController() {
  const { playing, toggle } = useBackgroundMusic();

  const handleClick = () => {
    bootAudio();
    toggle();
  };

  return (
    <button
      onClick={handleClick}
      data-hover
      title={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
      style={{
        position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000,
        width: 52, height: 52, borderRadius: "50%",
        background: playing ? "rgba(57,255,20,0.1)" : "rgba(10,10,10,0.85)",
        border: `1.5px solid ${playing ? "rgba(57,255,20,0.55)" : "rgba(255,255,255,0.09)"}`,
        backdropFilter: "blur(16px)",
        color: playing ? "var(--neon)" : "#444",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "none",
        transition: "all .3s cubic-bezier(.16,1,.3,1)",
        boxShadow: playing ? "0 0 28px rgba(57,255,20,0.28)" : "0 4px 20px rgba(0,0,0,0.5)",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.13)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      {playing ? (
        // Icon Pause
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect x="4" y="3" width="4" height="14" rx="1.5" />
          <rect x="12" y="3" width="4" height="14" rx="1.5" />
        </svg>
      ) : (
        // Icon Play
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <polygon points="5,3 17,10 5,17" />
        </svg>
      )}
    </button>
  );
}