import {
  Children, Suspense, createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState,
  type ReactNode, type RefObject,
} from "react";
import { gsap } from "gsap";
import { Warp } from "../3d/Backdrops";
import { playWhoosh } from "../../hooks/useSound";

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
  const tlRef = useRef<gsap.core.Timeline | null>(null);

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
    playWhoosh(dir);
    cur.current = next;
    setIndex(next);
    history.replaceState(null, "", `#${ids[next]}`);

    // Lần chuyển trước chưa chạy xong (quay lại nhanh, vd hero → about → hero) → tua nó tới cuối ngay.
    // Nếu không, onComplete của nó chạy sau và giấu mất slide đang được chuyển tới (màn hình trống/đứng hình).
    tlRef.current?.progress(1);

    inn.scrollTop = fromEdge && dir < 0 ? inn.scrollHeight : 0;

    const outItems = fxItems(out), inItems = fxItems(inn);
    const inKids = Array.from(inn.children);

    // Chuyển mượt kiểu crossfade: slide cũ trôi nhẹ + mờ dần, slide mới trôi vào từ hướng ngược lại
    gsap.killTweensOf([out, inn, ...inKids, ...outItems, ...inItems]);
    gsap.set(inn, { autoAlpha: 1, opacity: 0, yPercent: 0, y: 0, scale: 1, zIndex: 2 });
    gsap.set(out, { zIndex: 1 });
    inItems.forEach(el => gsap.set(el, fxFrom(el)));
    gsap.set(inKids, { y: dir * 48, scale: 0.985, transformOrigin: "50% 40%" });

    // Hero có nền đặc che kín thế giới 3D: nếu hiện nhanh thì cú bay của camera bị cắt ngang → nhìn rất gắt.
    // Khi quay về hero thì cho hero hiện chậm, đều, đuổi kịp lúc camera về tới trạm đầu (~1.5s).
    const toHero = ids[next] === "hero";
    const D = toHero ? 1.35 : 0.95;   // thời gian slide mới hiện ra
    const T = toHero ? 0.25 : 0.18;   // độ trễ so với lúc slide cũ bắt đầu mờ
    ctx.current.add(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (tlRef.current === tl) tlRef.current = null;
          // slide cũ về vị trí chờ phía dưới màn hình để các canvas 3D của nó tự dừng render
          // (bỏ qua nếu nó lại đang là slide hiện tại vì người dùng đã quay về)
          if (out !== getSlides()[cur.current]) gsap.set(out, { autoAlpha: 0, scale: 1, y: 0, yPercent: 100, opacity: 1 });
          gsap.set(outItems, { opacity: 1, clearProps: "filter,transform" });
        },
      });
      tlRef.current = tl;

      // 1) Slide cũ: trôi nhẹ ngược hướng, thu nhỏ chút và mờ dần
      tl.to(out, { opacity: 0, y: -dir * 40, scale: 0.98, duration: 0.6, ease: "power2.inOut" }, 0);

      // 2) Slide mới: hiện dần, nội dung trôi vào đúng chỗ
      tl.to(inn, { opacity: 1, duration: D * 0.8, ease: toHero ? "sine.inOut" : "power1.out", clearProps: "opacity" }, T);
      tl.to(inKids, { y: 0, scale: 1, duration: D + 0.2, ease: "power3.out", clearProps: "transform,transformOrigin" }, T);

      // 3) Từng khối nội dung bay vào lần lượt
      tl.to(inItems, {
        opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)",
        duration: 0.9, ease: "power3.out", stagger: 0.07,
        onComplete: () => { gsap.set(inItems, { clearProps: "filter" }); },
      }, T + 0.1);

      // Cho phép chuyển slide tiếp khi slide mới đã gần hiện hết
      tl.call(() => { busy.current = false; }, undefined, T + D * 0.8);
    });
  }, [n, ids]);

  useEffect(() => {
    const canScroll = (dir: number) => {
      const el = getSlides()[cur.current];
      if (!el) return false;
      const max = el.scrollHeight - el.clientHeight;
      return dir > 0 ? el.scrollTop < max - 2 : el.scrollTop > 2;
    };

    const modalOpen = () => !!document.body.dataset.modal;

    const onWheel = (e: WheelEvent) => {
      if (modalOpen()) { if (!(e.target as Element | null)?.closest?.("[data-modal-panel]")) e.preventDefault(); return; }   // trong panel thì để nó tự cuộn
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
      if (modalOpen()) return;
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
      if (modalOpen()) return;
      startY = e.touches[0].clientY;
      atTop = !canScroll(-1);
      atBottom = !canScroll(1);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (modalOpen()) return;
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

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="chroma" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset id="chroma-r" in="r" dx="0" dy="0" result="ro" />
            <feOffset id="chroma-b" in="b" dx="0" dy="0" result="bo" />
            <feBlend in="ro" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="bo" mode="screen" />
          </filter>
        </defs>
      </svg>

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
