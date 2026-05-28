import { useEffect } from "react";
import { playHover, playClick } from "./useSound";

export function useCursor() {
  useEffect(() => {
    const dot  = document.getElementById("cursor-dot")  as HTMLDivElement | null;
    const ring = document.getElementById("cursor-ring") as HTMLDivElement | null;
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0, raf = 0;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top  = my + "px";
    };

    const tick = () => {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + "px";
      ring.style.top  = ry + "px";
      raf = requestAnimationFrame(tick);
    };

    document.addEventListener("mousemove", onMove);
    tick();

    const onEnter = () => {
      ring.classList.add("hovering");
      dot.classList.add("hovering");
      playHover();
    };
    const onLeave = () => {
      ring.classList.remove("hovering");
      dot.classList.remove("hovering");
    };
    const onPointerDown = () => playClick();

    const attach = () => {
      document.querySelectorAll("a,button,[data-hover]").forEach(el => {
        el.addEventListener("mouseenter", onEnter);
        el.addEventListener("mouseleave", onLeave);
        el.addEventListener("pointerdown", onPointerDown);
      });
    };
    attach();
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, []);
}
