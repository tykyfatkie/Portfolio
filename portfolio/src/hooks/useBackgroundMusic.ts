import { useRef, useState, useCallback } from "react";

export function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/theme.mp3");
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;

    if (audio.paused) {
      audio.volume = 1;
      audio.play()
        .then(() => setPlaying(true))
        .catch(err => console.error("[music] ✗ failed:", err));
    } else {
      audio.pause(); // ← pause thẳng, không fade
      setPlaying(false);
    }
  }, []);

  return { playing, toggle };
}