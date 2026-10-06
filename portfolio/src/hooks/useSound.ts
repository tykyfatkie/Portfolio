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

// ─── Hiệu ứng âm thanh tổng hợp (không cần file): chuyển slide, mở/đóng, nhịp carousel ─────────────────
let noiseBuf: AudioBuffer | null = null;
function getNoise(a: AudioContext) {
  if (noiseBuf && noiseBuf.sampleRate === a.sampleRate) return noiseBuf;
  const len = a.sampleRate * 1.2;
  noiseBuf = a.createBuffer(1, len, a.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** Tiếng "vút" khi nhảy warp giữa các slide: dải nhiễu quét tần số + tiếng trầm. dir>0 đi xuống (quét lên), dir<0 ngược lại. */
export function playWhoosh(dir = 1) {
  const a = getAC(); if (!a) return;
  const t = a.currentTime, dur = 1.15;

  const src = a.createBufferSource();
  src.buffer = getNoise(a);
  const bp = a.createBiquadFilter();
  bp.type = "bandpass"; bp.Q.value = 1.4;
  const lo = dir > 0 ? 260 : 3200, hi = dir > 0 ? 3200 : 260;
  bp.frequency.setValueAtTime(lo, t);
  bp.frequency.exponentialRampToValueAtTime(hi, t + dur * 0.8);
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.42, t + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp); bp.connect(g); g.connect(a.destination);
  src.start(t); src.stop(t + dur);

  // tiếng trầm "thump" ở đầu cho có lực
  const o = a.createOscillator(), og = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(130, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.45);
  og.gain.setValueAtTime(0.5, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  o.connect(og); og.connect(a.destination);
  o.start(t); o.stop(t + 0.55);
}

function blip(from: number, to: number, type: OscillatorType, vol: number, dur: number, delay = 0) {
  const a = getAC(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(a.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

/** Mở bảng lệnh / chi tiết dự án: hai nốt đi lên. */
export function playOpen()  { blip(420, 640, "triangle", 0.5, 0.14); blip(640, 960, "sine", 0.4, 0.18, 0.07); }
/** Đóng: hai nốt đi xuống. */
export function playClose() { blip(900, 560, "triangle", 0.4, 0.13); blip(560, 340, "sine", 0.35, 0.18, 0.06); }
/** Nhịp carousel / di chuyển trong danh sách. */
export function playTick()  { blip(1400, 900, "square", 0.12, 0.05); }
