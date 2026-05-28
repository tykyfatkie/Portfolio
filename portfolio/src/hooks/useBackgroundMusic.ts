/**
 * useBackgroundMusic — loads /theme.mp3 and plays it as gentle looping background music.
 * Returns controls for play/pause and current playing state.
 */
import { useEffect, useRef, useState, useCallback } from "react";

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready,   setReady]   = useState(false);

  useEffect(() => {
    const audio = new Audio("/theme.mp3");
    audio.loop   = true;
    audio.volume = 0.18;   // nhẹ nhàng, du dương
    audio.preload = "auto";

    audio.addEventListener("canplaythrough", () => setReady(true), { once: true });
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // Fade in
      audio.volume = 0;
      audio.play().then(() => {
        setPlaying(true);
        let v = 0;
        const step = () => {
          v = Math.min(v + 0.005, 0.18);
          audio.volume = v;
          if (v < 0.18) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }).catch(() => {});
    } else {
      // Fade out then pause
      let v = audio.volume;
      const step = () => {
        v = Math.max(v - 0.005, 0);
        audio.volume = v;
        if (v > 0) requestAnimationFrame(step);
        else { audio.pause(); setPlaying(false); }
      };
      requestAnimationFrame(step);
    }
  }, []);

  return { playing, ready, toggle };
}
