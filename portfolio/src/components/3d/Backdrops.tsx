import { lazy, Suspense, type CSSProperties } from "react";
import { useBeat } from "../../lib/beat";

/**
 * Nền động của từng slide, dùng các component canvas của ThreeUI Community.
 * Mỗi nền tự dừng render khi slide không nằm trong khung nhìn (IntersectionObserver).
 * Import qua subpath để chỉ kéo đúng component cần dùng; lazy để không chặn lần paint đầu.
 */
export const loadLiquid    = () => import("@designcodeio/threeui/components/LiquidFormBackground");
export const loadRibbon    = () => import("@designcodeio/threeui/components/RibbonFieldBackground");
export const loadStream    = () => import("@designcodeio/threeui/components/StreamConvergenceBackground");
export const loadDots      = () => import("@designcodeio/threeui/components/DotMatrixBackground");
export const loadHorizon   = () => import("@designcodeio/threeui/components/EmeraldHorizonBackground");
export const loadWarp      = () => import("@designcodeio/threeui/components/WarpFieldBackground");

const Liquid  = lazy(() => loadLiquid().then(m => ({ default: m.LiquidFormBackground })));
const Ribbon  = lazy(() => loadRibbon().then(m => ({ default: m.RibbonFieldBackground })));
const Stream  = lazy(() => loadStream().then(m => ({ default: m.StreamConvergenceBackground })));
const Dots    = lazy(() => loadDots().then(m => ({ default: m.DotMatrixBackground })));
const Horizon = lazy(() => loadHorizon().then(m => ({ default: m.EmeraldHorizonBackground })));
export const Warp = lazy(() => loadWarp().then(m => ({ default: m.WarpFieldBackground })));

type Kind = "liquid" | "ribbon" | "stream" | "dots" | "horizon";

interface Props {
  kind: Kind;
  opacity?: number;
  blend?: CSSProperties["mixBlendMode"];
  /** Làm tối rìa để chữ ở giữa dễ đọc */
  vignette?: boolean;
}

const Backdrop = ({ kind, opacity = 0.5, blend = "normal", vignette = true }: Props) => {
  const b = useBeat();   // 0..1 theo bass của nhạc
  return (
  <div className="backdrop" style={{ opacity, mixBlendMode: blend }} aria-hidden>
    <Suspense fallback={null}>
      {kind === "liquid"  && <Liquid speed={0.7 + b * 1.6} morph={1.2 + b * 1.4} mouseAmount={0.35} metal={1.1} camera={6.2} tintHue={125} tintAmount={0.55} />}
      {kind === "ribbon"  && <Ribbon speed={0.8 + b * 2.4} pointerAmount={1.2} brightness={0.9 + b * 0.5} hue={0} />}
      {kind === "stream"  && <Stream speed={0.8 + b * 2.2} fidelity={0.5} brightness={0.85 + b * 0.5} hue={0} />}
      {kind === "dots"    && <Dots speed={0.8 + b * 1.5} gridScale={46} mouseAmount={0.12} pulseSpeed={0.5 + b * 2.5} radius={0.18 + b * 0.14} opacity={0.5 + b * 0.35} hue={90} />}
      {kind === "horizon" && <Horizon speed={0.8 + b * 1.8} glow={1.1 + b * 1.4} vignette={1.2} hue={0} />}
    </Suspense>
    {vignette && <div className="backdrop__vignette" />}
  </div>
  );
};

/** Warp field của hero: tốc độ và độ sáng theo bass. */
export const BeatWarp = () => {
  const b = useBeat();
  return <Warp variant="streaks" speed={9 + b * 32} streakOpacity={0.6 + b * 0.3} brightness={0.95 + b * 0.4} />;
};

export default Backdrop;
