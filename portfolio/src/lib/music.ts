import { assets } from "./preload";
import { getAudioContext } from "../hooks/useSound";

/**
 * Nhạc nền dùng chung toàn app (một HTMLAudioElement duy nhất) + AnalyserNode để các hiệu ứng phản ứng theo nhạc.
 * `level` được AudioWave cập nhật mỗi frame khi nhạc đang phát; các cảnh 3D chỉ cần đọc.
 */
export const level = { bass: 0, value: 0 };

let audio: HTMLAudioElement | null = null;
let analyser: AnalyserNode | null = null;
let playing = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function ensureAudio() {
  if (!audio) {
    audio = new Audio(assets.music);
    audio.loop = true;
    audio.volume = 0.8;
  }
  return audio;
}

/** Nối audio vào AnalyserNode; chỉ thành công khi AudioContext đã được mở sau thao tác người dùng. */
export function ensureAnalyser(): AnalyserNode | null {
  if (analyser) return analyser;
  const ac = getAudioContext();
  if (!ac || !audio) return null;
  try {
    const src = ac.createMediaElementSource(audio);
    const an = ac.createAnalyser();
    an.fftSize = 64;
    an.smoothingTimeConstant = 0.78;
    src.connect(an);
    an.connect(ac.destination);
    analyser = an;
  } catch {
    return null;
  }
  return analyser;
}

export function toggleMusic() {
  const a = ensureAudio();
  if (a.paused) {
    ensureAnalyser();
    a.play()
      .then(() => { playing = true; emit(); })
      .catch(err => console.error("[music] ✗ failed:", err));
  } else {
    a.pause();
    playing = false;
    level.bass = 0;
    level.value = 0;
    emit();
  }
}

export const subscribeMusic = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const isPlaying = () => playing;
