import { useEffect, useRef } from "react";
import * as THREE from "three";

const TECH = [
  "ReactJS", "TypeScript", "React Native", "Angular", "TailwindCSS", "ASP.NET Core", "Django", "Python",
  "C#", "Node.js", "MySQL", "PostgreSQL", "Firebase", "Supabase", "Docker", "Redis", "Git", "Vite",
  "Zustand", "YOLOv8", "Android", "Figma", "REST API", "SQLite", "GSAP", "Three.js",
];
const COLORS = ["#39ff14", "#ff2d78", "#00cfff", "#ffd700"];

const makeLabel = (text: string, color: string) => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.font = "700 54px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
};

/** Quả cầu 3D chứa tên công nghệ, tự xoay, kéo chuột để xoay tay. */
const TechGlobe = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = false; // luôn chạy animation (chủ ý của chủ site)

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
    camera.position.z = 5.8;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const el = renderer.domElement;
    el.style.touchAction = "pan-y";

    const globe = new THREE.Group();
    scene.add(globe);
    const R = 2.7;

    // Khung cầu wireframe mờ
    const shellGeo = new THREE.IcosahedronGeometry(R * 0.98, 2);
    const shellWire = new THREE.WireframeGeometry(shellGeo);
    const shellMat = new THREE.LineBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.07 });
    globe.add(new THREE.LineSegments(shellWire, shellMat));

    // Nhãn phân bố theo Fibonacci
    const sprites: { s: THREE.Sprite; mat: THREE.SpriteMaterial; tex: THREE.Texture }[] = [];
    TECH.forEach((name, i) => {
      const y = 1 - (i / (TECH.length - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = Math.PI * (3 - Math.sqrt(5)) * i;
      const tex = makeLabel(name, COLORS[i % COLORS.length]);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
      const s = new THREE.Sprite(mat);
      s.position.set(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R);
      s.scale.set(1.5, 0.375, 1);
      globe.add(s);
      sprites.push({ s, mat, tex });
    });

    // Kéo để xoay
    let dragging = false, lx = 0, ly = 0, vx = 0, vy = 0;
    const down = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      vy = (e.clientX - lx) * 0.005;
      vx = (e.clientY - ly) * 0.005;
      lx = e.clientX;
      ly = e.clientY;
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
      if (!dragging) {
        vy += ((reduce ? 0 : 0.003) - vy) * 0.04;
        vx *= 0.95;
      }
      globe.rotation.y += vy;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + vx, -1, 1);
      // nhãn phía sau mờ + nhỏ hơn → cảm giác chiều sâu
      sprites.forEach(({ s, mat }) => {
        s.getWorldPosition(wp);
        const d = (wp.z + R) / (2 * R); // 0 = sau, 1 = trước
        mat.opacity = 0.15 + d * 0.85;
        const k = 0.7 + d * 0.5;
        s.scale.set(1.5 * k, 0.375 * k, 1);
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
      shellGeo.dispose();
      shellWire.dispose();
      shellMat.dispose();
      renderer.dispose();
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "min(520px, 80vw)", cursor: "grab" }} />;
};

export default TechGlobe;
