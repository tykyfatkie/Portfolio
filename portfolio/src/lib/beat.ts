import { useSyncExternalStore } from "react";

/**
 * Mức bass của nhạc dưới dạng store React (lượng tử hoá 0.05) để các component nền ThreeUI
 * truyền vào props `speed`, `glow`... mà không phải re-render quá dày.
 * AudioWave đẩy giá trị vào mỗi frame; các component chỉ đọc qua useBeat().
 */
let value = 0;
const subs = new Set<() => void>();

export function pushBeat(x: number) {
  const q = Math.round(Math.min(1, Math.max(0, x)) * 20) / 20;
  if (q === value) return;
  value = q;
  subs.forEach(s => s());
}

const subscribe = (s: () => void) => { subs.add(s); return () => { subs.delete(s); }; };
const getSnapshot = () => value;

/** 0..1, bước 0.05 */
export const useBeat = () => useSyncExternalStore(subscribe, getSnapshot);
