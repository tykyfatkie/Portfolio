import { useEffect } from "react";
import { bootAudio, playHover, playClick } from "./useSound";

// Tất cả element có thể hover — mở rộng selector để bắt hết
const HOVER_SEL = [
  "a",
  "button",
  "[data-hover]",
  ".proj-card",
  ".pj-card",
  ".cp__item",
  ".proj-link",
  ".proj-pill",
  ".form-input",
  ".section-label",
  ".marquee-track span",
  "input",
  "textarea",
].join(",");

export function useCursor() {
  useEffect(() => {
    const dot  = document.getElementById("cursor-dot")  as HTMLDivElement | null;
    const ring = document.getElementById("cursor-ring") as HTMLDivElement | null;
    if (!dot || !ring) return;

    const label = document.createElement("span");
    label.className = "cursor-label";
    ring.appendChild(label);
    let labelOf: Element | null = null;

    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;
    let currentHovered: Element | null = null;

    // ── cursor follow ────────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
    };
    const tick = () => {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
      raf = requestAnimationFrame(tick);
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    tick();

    // ── hover: chỉ fire khi vào element MỚI ─────────────────────────────────
    const onOver = (e: MouseEvent) => {
      const lab = (e.target as Element).closest<HTMLElement>("[data-cursor]");
      if (lab !== labelOf) {
        labelOf = lab;
        label.textContent = lab?.dataset.cursor ?? "";
        ring.classList.toggle("labeled", !!lab);
      }
      const target = (e.target as Element).closest(HOVER_SEL);
      if (!target || target === currentHovered) return;
      currentHovered = target;
      ring.classList.add("hovering");
      dot.classList.add("hovering");
      playHover();
    };

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as Element | null;
      if (related && currentHovered?.contains(related)) return;
      if (related?.closest(HOVER_SEL)) return;
      currentHovered = null;
      ring.classList.remove("hovering");
      dot.classList.remove("hovering");
    };

    // ── mousedown: boot AudioContext (user gesture) + play click ─────────────
    const onDown = (e: MouseEvent) => {
      bootAudio();
      if ((e.target as Element).closest(HOVER_SEL)) playClick();
    };

    document.addEventListener("mouseover",  onOver, { passive: true });
    document.addEventListener("mouseout",   onOut,  { passive: true });
    document.addEventListener("mousedown",  onDown);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout",  onOut);
      document.removeEventListener("mousedown", onDown);
      cancelAnimationFrame(raf);
    };
  }, []);
}
