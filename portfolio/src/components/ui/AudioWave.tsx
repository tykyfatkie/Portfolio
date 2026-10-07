import { useEffect, useRef } from "react";
import { useBackgroundMusic } from "../../hooks/useBackgroundMusic";
import { bootAudio } from "../../hooks/useSound";
import { ensureAnalyser, level } from "../../lib/music";
import { pushBeat } from "../../lib/beat";

const BARS = 24;
const REST = 0.14;

/**
 * Sóng âm trên thanh menu: nhảy theo phổ tần số thật của bản nhạc, bấm để bật/tắt nhạc.
 * Đồng thời ghi mức bass vào `level` và biến CSS --beat cho các hiệu ứng khác (hero) phản ứng theo nhịp.
 */
const AudioWave = () => {
  const { playing, toggle } = useBackgroundMusic();
  const bars = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const cur = new Array(BARS).fill(REST);
    const data = new Uint8Array(32);
    const root = document.documentElement;
    let raf = 0;

    const paint = () => bars.current.forEach((el, i) => { if (el) el.style.transform = `scaleY(${cur[i]})`; });

    if (!playing) {
      cur.fill(REST);
      paint();
      root.style.setProperty("--beat", "0");
      pushBeat(0);
      return;
    }

    const tick = () => {
      const an = ensureAnalyser();
      const t = performance.now() / 1000;
      if (an) an.getByteFrequencyData(data);

      for (let i = 0; i < BARS; i++) {
        let target: number;
        if (an) {
          const bin = Math.min(31, Math.floor(Math.pow(i / (BARS - 1), 1.5) * 22) + 1);
          target = REST + (data[bin] / 255) * (1 - REST);
        } else {
          target = 0.25 + 0.5 * Math.abs(Math.sin(t * 3 + i * 0.8)); // chưa nối được analyser → sóng giả
        }
        cur[i] += (target - cur[i]) * 0.35;
      }
      paint();

      if (an) {
        level.bass = (data[1] + data[2] + data[3] + data[4]) / (4 * 255);
        level.value = data.reduce((a, b) => a + b, 0) / (data.length * 255);
      } else {
        level.bass = 0.3 + 0.3 * Math.abs(Math.sin(t * 2.2));
        level.value = level.bass * 0.7;
      }
      root.style.setProperty("--beat", level.bass.toFixed(3));
      pushBeat(level.bass);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); };
  }, [playing]);

  return (
    <button
      className={`audio-wave${playing ? " is-on" : ""}`}
      data-hover
      data-cursor={playing ? "MUTE" : "PLAY"}
      onClick={() => { bootAudio(); toggle(); }}
      aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
      title={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
    >
      <span className="audio-wave__bars" aria-hidden>
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} ref={el => { bars.current[i] = el; }} style={{ ["--c" as string]: `hsl(${120 + (i / (BARS - 1)) * 210} 100% 58%)` }} />
        ))}
      </span>
      <span className="audio-wave__label"><b>SOUND</b><i>{playing ? "ON" : "OFF"}</i></span>
    </button>
  );
};

export default AudioWave;
