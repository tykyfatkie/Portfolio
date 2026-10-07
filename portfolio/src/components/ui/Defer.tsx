import type { ReactNode } from "react";
import { useSettled } from "../../lib/settled";

/** Chỉ dựng `children` sau khi loading đã xong (+ ms) để không làm giật phần outro. `fallback` giữ chỗ cho khỏi nhảy bố cục. */
const Defer = ({ ms = 0, fallback = null, children }: { ms?: number; fallback?: ReactNode; children: ReactNode }) =>
  <>{useSettled(ms) ? children : fallback}</>;

export default Defer;
