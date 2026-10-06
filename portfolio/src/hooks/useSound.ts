// ─── Singleton AudioContext — chỉ tạo sau user gesture ───────────────────────
let AC: AudioContext | null = null;

/** Chỉ gọi trong event handler (click / mousedown / touchstart) */
export function bootAudio() {
  if (AC && AC.state !== "closed") {
    if (AC.state === "suspended") AC.resume();
    return;
  }
  // Tạo mới — an toàn vì đang trong user gesture
  AC = new AudioContext();
  // Warm-up silent buffer để đảm bảo unlock hoàn toàn
  const b = AC.createBuffer(1, 1, AC.sampleRate);
  const s = AC.createBufferSource();
  s.buffer = b; s.connect(AC.destination); s.start(0);
}

/** Trả về AC nếu đã sẵn sàng, null nếu chưa boot */
function getAC(): AudioContext | null {
  if (!AC || AC.state === "closed") return null;
  if (AC.state === "suspended") AC.resume();
  return AC;
}

export function playHover() {
  const a = getAC(); if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g   = a.createGain();
  osc.connect(g); g.connect(a.destination);
  osc.type = "sine";
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(1300, t + 0.05);
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
  osc.start(t); osc.stop(t + 0.12);
}

export function playClick() {
  const a = getAC(); if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const g   = a.createGain();
  osc.connect(g); g.connect(a.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(650, t);
  osc.frequency.exponentialRampToValueAtTime(250, t + 0.08);
  g.gain.setValueAtTime(0.8, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  osc.start(t); osc.stop(t + 0.17);
}

/** AudioContext dùng chung (đã mở sau thao tác người dùng), hoặc null nếu chưa boot. */
export function getAudioContext(): AudioContext | null {
  return getAC();
}
