import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLOBE_LABELS } from "../../data/skills";

const makeLabel = (text: string, color: string) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.font = "700 54px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 26;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

interface Props {
  /** id nhóm đang được rê chuột: nhãn của nhóm sáng lên, nối nhau bằng đường kẻ; null = bình thường */
  active: string | null;
}

/** Quả cầu 3D chứa tên công nghệ tô màu theo nhóm; tự xoay, kéo chuột để xoay tay. */
const TechGlobe = ({ active }: Props) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(active);
  activeRef.current = active;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 6.4;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const el = renderer.domElement;
    el.style.touchAction = "pan-y";

    const globe = new THREE.Group();
    scene.add(globe);
    const R = 2.75;

    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T { disposables.push(d); return d; }

    // Khung cầu wireframe mờ + hai vòng quỹ đạo
    const shellGeo = track(new THREE.IcosahedronGeometry(R * 0.98, 2));
    globe.add(new THREE.LineSegments(
      track(new THREE.WireframeGeometry(shellGeo)),
      track(new THREE.LineBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.07 })),
    ));
    const ringGeo = track(new THREE.TorusGeometry(R * 1.12, 0.008, 8, 200));
    ([[1.25, 0, 0x00cfff], [0.35, 0.9, 0xff2d78]] as const).forEach(([rx, ry, color]) => {
      const ring = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })));
      ring.rotation.set(rx, ry, 0);
      scene.add(ring);
    });

    // Nhãn phân bố Fibonacci, tô màu theo nhóm
    type S = { s: THREE.Sprite; mat: THREE.SpriteMaterial; tex: THREE.Texture; group: string; color: string; glow: number; boost: number };
    const sprites: S[] = [];
    const N = GLOBE_LABELS.length;
    GLOBE_LABELS.forEach((lb, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = Math.PI * (3 - Math.sqrt(5)) * i;
      const tex = makeLabel(lb.text, lb.color);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const s = new THREE.Sprite(mat);
      s.position.set(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
      s.scale.set(1.5, 0.375, 1);
      globe.add(s);
      sprites.push({ s, mat, tex, group: lb.group, color: lb.color, glow: 1, boost: 1 });
    });

    // Đường nối các nhãn cùng nhóm (dựng lại mỗi lần đổi nhóm đang chọn)
    const lineMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
    let lineGeo = track(new THREE.BufferGeometry());
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    lines.visible = false;
    globe.add(lines);
    let builtFor: string | null = null;
    const rebuildLines = (group: string | null) => {
      builtFor = group;
      if (!group) { lines.visible = false; return; }
      const pts = sprites.filter(x => x.group === group);
      const pos: number[] = [];
      for (let a = 0; a < pts.length; a++)
        for (let b = a + 1; b < pts.length; b++)
          pos.push(pts[a].s.position.x, pts[a].s.position.y, pts[a].s.position.z, pts[b].s.position.x, pts[b].s.position.y, pts[b].s.position.z);
      lineGeo.dispose();
      lineGeo = track(new THREE.BufferGeometry());
      lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      lines.geometry = lineGeo;
      lineMat.color.set(pts[0]?.color ?? "#39ff14");
      lines.visible = true;
    };

    // Kéo để xoay
    let dragging = false, lx = 0, vx = 0, vy = 0;
    const down = (e: PointerEvent) => { dragging = true; lx = e.clientX; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      vy = (e.clientX - lx) * 0.005;
      vx = (e.movementY || 0) * 0.005;
      lx = e.clientX;
    };
    const up = () => { dragging = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    let raf = 0, visible = true;
    const wp = new THREE.Vector3();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;

      const act = activeRef.current;
      if (act !== builtFor) rebuildLines(act);

      if (!dragging) {
        vy += ((act ? 0.0012 : 0.003) - vy) * 0.04; // chậm lại khi đang soi một nhóm
        vx *= 0.95;
      }
      globe.rotation.y += vy;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + vx, -1, 1);

      sprites.forEach(sp => {
        const inGroup = !act || sp.group === act;
        sp.glow += ((inGroup ? 1 : 0.18) - sp.glow) * 0.12;
        sp.boost += (((act && sp.group === act) ? 1.45 : 1) - sp.boost) * 0.12;
        sp.s.getWorldPosition(wp);
        const d = (wp.z + R) / (2 * R); // 0 = sau, 1 = trước
        const depthOpacity = act && sp.group === act ? 0.55 + d * 0.45 : 0.15 + d * 0.85;
        sp.mat.opacity = depthOpacity * sp.glow;
        const k = (0.7 + d * 0.5) * sp.boost;
        sp.s.scale.set(1.5 * k, 0.375 * k, 1);
      });

      renderer.render(scene, camera);
    };
    animate();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      sprites.forEach(({ mat, tex }) => { mat.dispose(); tex.dispose(); });
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "min(640px, 92vw)", cursor: "grab" }} />;
};

export default TechGlobe;
