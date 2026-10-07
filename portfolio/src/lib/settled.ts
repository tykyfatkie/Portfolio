import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Cờ "đã ổn định": bật khi màn hình loading đã mở xong. Các cảnh 3D nặng của những slide không phải hero
 * chờ cờ này (cộng thêm độ trễ riêng để dựng lần lượt) nên không tranh luồng chính với phần outro của loading.
 */
let settled = false;
const subs = new Set<() => void>();
export const markSettled = () => { if (settled) return; settled = true; subs.forEach(s => s()); };
const subscribe = (s: () => void) => { subs.add(s); return () => { subs.delete(s); }; };

/** true khi loading đã xong và đã qua `delay` ms. */
export function useSettled(delay = 0) {
  const s = useSyncExternalStore(subscribe, () => settled);
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (!s) return;
    const id = window.setTimeout(() => setOk(true), delay);
    return () => clearTimeout(id);
  }, [s, delay]);
  return ok;
}
