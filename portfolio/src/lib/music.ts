import { assets } from "./preload";
import { getAudioContext } from "../hooks/useSound";

/**
 * Nhạc nền dùng chung toàn app (một HTMLAudioElement duy nhất) + AnalyserNode để các hiệu ứng phản ứng theo nhạc.
 * `level` được AudioWave cập nhật mỗi frame khi nhạc đang phát; các cảnh 3D chỉ cần đọc.
 */
export const level = { bass: 0, value: 0, flash: 0 };

let audio: HTMLAudioElement | null = null;
let analyser: AnalyserNode | null = null;
let kickAnalyser: AnalyserNode | null = null;   // FFT lớn, gần như không làm mượt → bắt được cú đánh của trống/bass
let kickBuf: Uint8Array<ArrayBuffer> | null = null, kickLo = 1, kickHi = 3;
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
    const ka = ac.createAnalyser();
    ka.fftSize = 1024;
    ka.smoothingTimeConstant = 0.15;
    ka.minDecibels = -80; ka.maxDecibels = 0;               // mặc định (-100…-30) bị chạm trần với bản nhạc to → không còn gì để bắt nhịp
    src.connect(ka);
    kickAnalyser = ka;
    kickBuf = new Uint8Array(ka.frequencyBinCount);
    const hz = ac.sampleRate / ka.fftSize;                  // độ rộng mỗi bin
    kickLo = Math.max(1, Math.round(40 / hz)); kickHi = Math.max(kickLo, Math.round(150 / hz));
    an.connect(ac.destination);
    analyser = an;
  } catch {
    return null;
  }
  return analyser;
}

/** Năng lượng thực sự ở dải bass (≈40–150 Hz), 0..1, gần như tức thời — dùng để bắt nhịp. */
export function readKick(): number {
  if (!kickAnalyser || !kickBuf) return 0;
  kickAnalyser.getByteFrequencyData(kickBuf);
  let s = 0;
  for (let i = kickLo; i <= kickHi; i++) s += kickBuf[i];
  return s / ((kickHi - kickLo + 1) * 255);
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

/** Chỉ bật nếu đang tắt (không đảo trạng thái) — dùng cho "click bất kỳ đâu để bắt đầu". */
export function startMusic() {
  if (ensureAudio().paused) toggleMusic();
}
