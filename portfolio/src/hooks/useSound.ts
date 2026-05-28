/**
 * useSound — Web Audio API sound effects (no external files needed)
 * Plays a soft synthetic click/hover sound on interactive elements.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Soft UI click — short sine blip */
export function playHover() {
  try {
    const ac = getCtx();
    if (ac.state === "suspended") ac.resume();

    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    // Neon-cyan blip: 880 Hz → 1200 Hz glide
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.05);

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.14);
  } catch (_) {
    // silence errors in environments without AudioContext
  }
}

/** Slightly deeper click for button press */
export function playClick() {
  try {
    const ac = getCtx();
    if (ac.state === "suspended") ac.resume();

    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.08);

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.09, ac.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.18);

    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.2);
  } catch (_) {}
}

/** Soft whoosh for section / card hover */
export function playWhoosh() {
  try {
    const ac = getCtx();
    if (ac.state === "suspended") ac.resume();

    const bufSize = ac.sampleRate * 0.12;
    const buf  = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

    const src    = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const gain   = ac.createGain();

    src.buffer = buf;
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3000, ac.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 0.12);
    filter.Q.value = 0.5;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ac.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);

    src.start(ac.currentTime);
  } catch (_) {}
}
