import {
  Children, Suspense, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
  type ReactNode, type RefObject,
} from "react";
import { gsap } from "gsap";
(window as unknown as { __gsap: typeof gsap }).__gsap = gsap; // TEMP-DEBUG
import { Warp } from "../3d/Backdrops";

/**
 * Chế độ "slide": mỗi section là một slide toàn màn hình.
 * - Chuyển slide bằng lăn chuột, phím mũi tên / PageUp / PageDown / Space / Home / End, vuốt cảm ứng, dot bên phải hoặc link #anchor.
 * - Slide dài hơn màn hình vẫn cuộn bên trong; chỉ chuyển slide khi đã chạm mép trên/dưới.
 */

/**
 * Khối nào gắn data-fx="up|left|right|zoom|fade" sẽ được dàn dựng riêng khi chuyển slide
 * (bay vào lần lượt theo thứ tự DOM, bay ra khi rời đi). Phát lại mỗi lần ghé thăm slide.
 */
const FX_FROM: Record<string, gsap.TweenVars> = {
  up: { y: 70 }, left: { x: -90 }, right: { x: 90 }, zoom: { scale: 0.78 }, fade: {},
};
const fxItems = (slide: HTMLElement) => Array.from(slide.querySelectorAll<HTMLElement>("[data-fx]"));
const fxFrom = (el: HTMLElement): gsap.TweenVars =>
  ({ opacity: 0, filter: "blur(10px)", ...(FX_FROM[el.dataset.fx ?? "up"] ?? FX_FROM.up) });

interface DeckCtx {
  index: number;
  ids: string[];
  goTo: (i: number, fromEdge?: boolean) => void;
  deckRef: RefObject<HTMLElement | null>;
}

const DeckContext = createContext<DeckCtx>({ index: 0, ids: [], goTo: () => {}, deckRef: { current: null } });
export const useDeck = () => useContext(DeckContext);

interface ProviderProps { ids: string[]; labels: string[]; children: ReactNode }

export const DeckProvider = ({ ids, labels, children }: ProviderProps) => {
  const n = ids.length;
  const [index, setIndex] = useState(() => Math.max(0, ids.indexOf(window.location.hash.slice(1))));
  const cur = useRef(index);
  const busy = useRef(false);
  const lastWheel = useRef(0);
  const deckRef = useRef<HTMLElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<HTMLDivElement>(null);

  const getSlides = () => Array.from(deckRef.current?.children ?? []) as HTMLElement[];

  const ctx = useRef<gsap.Context | null>(null);

  // Đặt vị trí ban đầu trước khi paint; gsap.context để dọn toàn bộ tween khi unmount
  useLayoutEffect(() => {
    ctx.current = gsap.context(() => {}, deckRef);
    if (jumpRef.current) gsap.set(jumpRef.current, { yPercent: 100, opacity: 0 });
    getSlides().forEach((el, i) => {
      gsap.set(el, { yPercent: i === cur.current ? 0 : 100, autoAlpha: i === cur.current ? 1 : 0, zIndex: i === cur.current ? 2 : 1 });
    });
    return () => ctx.current?.revert();
  }, []);

  const goTo = useCallback((next: number, fromEdge = false) => {
    const from = cur.current;
    if (busy.current || next === from || next < 0 || next >= n) return;
    const slides = getSlides();
    const out = slides[from], inn = slides[next];
    if (!out || !inn || !ctx.current) return;

    const dir = next > from ? 1 : -1;
    busy.current = true;
    cur.current = next;
    setIndex(next);
    history.replaceState(null, "", `#${ids[next]}`);

    inn.scrollTop = fromEdge && dir < 0 ? inn.scrollHeight : 0;

    const outItems = fxItems(out), inItems = fxItems(inn);
    const wipe = wipeRef.current, jump = jumpRef.current;
    const inKids = Array.from(inn.children);

    // Slide mới nằm trên, bị che hoàn toàn bằng clip-path rồi được "vén" ra theo dải sáng
    gsap.killTweensOf([...outItems, ...inItems]);
    gsap.set(inn, {
      autoAlpha: 1, opacity: 1, yPercent: 0, scale: 1, zIndex: 2,
      clipPath: dir > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
    });
    gsap.set(out, { zIndex: 1 });
    inItems.forEach(el => gsap.set(el, fxFrom(el)));
    gsap.set(inKids, { y: dir * 140, scale: 0.9, transformOrigin: "50% 25%" });

    const D = 1.3;       // thời gian vén slide
    const T = 0.22;      // độ trễ so với lúc slide cũ bắt đầu tản
    ctx.current.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          // slide cũ về vị trí chờ phía dưới màn hình để các canvas 3D của nó tự dừng render
          gsap.set(out, { autoAlpha: 0, scale: 1, yPercent: 100, opacity: 1 });
          gsap.set(outItems, { opacity: 1, clearProps: "filter,transform" });
        },
      });

      // 1) Nội dung slide cũ tản ra từng khối: trôi ngược hướng, mờ nhoè dần
      tl.to(outItems, {
        opacity: 0, y: -dir * 70, scale: 0.92, filter: "blur(10px)",
        duration: 0.55, ease: "power2.in", stagger: 0.04,
      }, 0);
      // 2) Cả slide cũ bị "hút" lướt qua camera: phóng to, mờ dần
      tl.to(out, { scale: 1.18, opacity: 0, duration: D * 0.9, ease: "power3.in" }, 0.05);

      // 3) Slide mới được vén ra, nội dung từ xa lao vào đúng chỗ (parallax so với mép vén)
      tl.to(inn, { clipPath: "inset(0% 0% 0% 0%)", duration: D, ease: "power3.inOut", clearProps: "clipPath" }, T);
      tl.to(inKids, { y: 0, scale: 1, duration: D + 0.3, ease: "power3.out", clearProps: "transform,transformOrigin" }, T);

      // 4) Hiệu ứng "nhảy warp": canvas hyperspace của ThreeUI phủ lên rồi tan đi
      if (jump) {
        tl.set(jump, { yPercent: 0, opacity: 0 }, 0)
          .to(jump, { opacity: 0.95, duration: 0.4, ease: "power2.out" }, 0)
          .to(jump, { opacity: 0, duration: 0.8, ease: "power2.inOut" }, T + D * 0.5)
          .set(jump, { yPercent: 100 }, T + D * 0.5 + 0.8);
      }

      // 5) Dải sáng bám đúng mép vén
      if (wipe) {
        tl.fromTo(wipe,
          { yPercent: dir > 0 ? 100 : -100, scaleY: dir > 0 ? 1 : -1, autoAlpha: 1 },
          { yPercent: 0, duration: D, ease: "power3.inOut" }, T);
        tl.to(wipe, { autoAlpha: 0, duration: 0.3, ease: "power1.out" }, T + D - 0.05);
      }

      // 6) Khối nội dung slide mới bay vào lần lượt khi mép vén đi được nửa đường
      tl.to(inItems, {
        opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)",
        duration: 1, ease: "power3.out", stagger: 0.09,
        onComplete: () => { gsap.set(inItems, { clearProps: "filter" }); },
      }, T + D * 0.4);

      // Cho phép chuyển slide tiếp ngay khi slide mới đã lộ hết
      tl.call(() => { busy.current = false; }, undefined, T + D);
    });
  }, [n, ids]);

  useEffect(() => {
    const canScroll = (dir: number) => {
      const el = getSlides()[cur.current];
      if (!el) return false;
      const max = el.scrollHeight - el.clientHeight;
      return dir > 0 ? el.scrollTop < max - 2 : el.scrollTop > 2;
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX) || Math.abs(e.deltaY) < 4) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      const now = performance.now();
      const fresh = now - lastWheel.current > 200; // phân biệt cử chỉ mới và quán tính
      lastWheel.current = now;
      if (busy.current) { e.preventDefault(); return; }
      if (canScroll(dir)) return; // để slide tự cuộn bên trong
      e.preventDefault();
      if (fresh) goTo(cur.current + dir, true);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
      let dir = 0;
      if (["ArrowDown", "PageDown"].includes(e.key) || (e.key === " " && !e.shiftKey)) dir = 1;
      else if (["ArrowUp", "PageUp"].includes(e.key) || (e.key === " " && e.shiftKey)) dir = -1;
      else if (e.key === "Home") { e.preventDefault(); goTo(0); return; }
      else if (e.key === "End") { e.preventDefault(); goTo(n - 1); return; }
      if (!dir) return;
      e.preventDefault();
      if (canScroll(dir)) getSlides()[cur.current].scrollBy({ top: dir * window.innerHeight * 0.8, behavior: "smooth" });
      else goTo(cur.current + dir, true);
    };

    let startY = 0, atTop = false, atBottom = false;
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      atTop = !canScroll(-1);
      atBottom = !canScroll(1);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 60) return;
      if (dy > 0 && atBottom) goTo(cur.current + 1, true);
      else if (dy < 0 && atTop) goTo(cur.current - 1, true);
    };

    // Link #anchor → chuyển slide
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const i = ids.indexOf(a.getAttribute("href")!.slice(1));
      if (i >= 0) { e.preventDefault(); goTo(i); }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("click", onClick);
    };
  }, [goTo, ids, n]);

  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <DeckContext.Provider value={{ index, ids, goTo, deckRef }}>
      {children}

      {/* Overlay hyperspace (ThreeUI WarpField) — nằm ngoài màn hình khi nghỉ để tự dừng render */}
      <div ref={jumpRef} className="deck-jump" aria-hidden>
        <Suspense fallback={null}>
          <Warp variant="hyperspace" speed={14} streakOpacity={0.9} tileOpacity={0} brightness={1.1} />
        </Suspense>
      </div>

      <div ref={wipeRef} className="deck-wipe" />

      <nav className="deck-dots" aria-label="Slides">
        {ids.map((id, i) => (
          <button key={id} className={`deck-dot${i === index ? " active" : ""}`} onClick={() => goTo(i)} aria-label={labels[i]}>
            <span className="deck-dot__label">{labels[i]}</span>
            <span className="deck-dot__pip" />
          </button>
        ))}
      </nav>

      <div className="deck-counter" aria-hidden>
        <span key={index} className="deck-counter__num">{pad(index + 1)}</span>
        <span className="deck-counter__total">/ {pad(n)}</span>
        <span className="deck-counter__label">{labels[index]}</span>
      </div>
    </DeckContext.Provider>
  );
};

export const SlideDeck = ({ children }: { children: ReactNode }) => {
  const { deckRef } = useDeck();
  return (
    <main className="deck" ref={deckRef}>
      {Children.toArray(children).map((c, i) => <div className="slide" key={i}>{c}</div>)}
    </main>
  );
};
