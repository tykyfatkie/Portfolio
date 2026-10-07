import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import opentype from "opentype.js";
import { gsap } from "gsap";
import { level } from "../../lib/music";

/**
 * Tên ở hero dựng bằng hình học 3D thật: đường nét lấy từ chính font Bebas Neue (opentype.js) → ExtrudeGeometry có vát cạnh,
 * vật liệu kim loại + môi trường phản chiếu, ba đèn neon bay theo chuột. Vị trí từng chữ khớp với bản DOM bên dưới
 * (DOM chỉ bị ẩn đi khi bản 3D đã sẵn sàng; nếu có lỗi thì bản DOM vẫn hiện như cũ).
 */
const FONT_URL = "/fonts/BebasNeue-Regular.woff";
const PAD_X = 160, PAD_Y = 120;
const BASELINE_K = 0.25;   // baseline = tâm dòng + 0.25·fontSize (đã hiệu chỉnh khớp bản DOM)

const Title3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    const h1 = mount?.parentElement as HTMLElement | null;
    if (!mount || !h1) return;
    let alive = true;
    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T { disposables.push(d); return d; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 10, 6000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    scene.environmentIntensity = 0.9;

    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(-300, 400, 600); scene.add(key);
    const pGreen = new THREE.PointLight(0x39ff14, 2.2e6, 0, 2), pPink = new THREE.PointLight(0xff2d78, 1.8e6, 0, 2), pCyan = new THREE.PointLight(0x00cfff, 1.6e6, 0, 2);
    scene.add(pGreen, pPink, pCyan);

    const group = new THREE.Group();
    scene.add(group);

    const matWhite = track(new THREE.MeshStandardMaterial({ color: 0xf4f4f4, metalness: 0.85, roughness: 0.26, emissive: 0x111111 }));
    const matNeon  = track(new THREE.MeshStandardMaterial({ color: 0x39ff14, metalness: 0.55, roughness: 0.3, emissive: 0x0b7a00, emissiveIntensity: 0.9 }));
    const mats = [matWhite, matNeon, matWhite];

    let glyphs: THREE.Mesh[] = [];
    let fontPromise: Promise<opentype.Font> | null = null;
    const loadFont = () => (fontPromise ??= fetch(FONT_URL).then(r => { if (!r.ok) throw new Error("font"); return r.arrayBuffer(); }).then(b => opentype.parse(b)));

    const clearGlyphs = () => { glyphs.forEach(m => { group.remove(m); m.geometry.dispose(); }); glyphs = []; };

    /** Dựng lại toàn bộ chữ từ bố cục DOM hiện tại. */
    const build = async (animate: boolean) => {
      const font = await loadFont();
      if (!alive) return;
      const front = h1.querySelector<HTMLElement>(".xt-front");
      if (!front) return;
      const lines = Array.from(front.querySelectorAll<HTMLElement>(".glitch-wrap, [aria-label]"));
      if (!lines.length) return;

      const fs = parseFloat(getComputedStyle(h1).fontSize);
      const spacing = -0.01;                                   // letter-spacing của h1 (-.01em)
      const depth = fs * 0.2;
      const W = h1.offsetWidth + PAD_X * 2, H = h1.offsetHeight + PAD_Y * 2;
      renderer.setSize(W, H);
      mount.style.cssText = `position:absolute;left:${-PAD_X}px;top:${-PAD_Y}px;width:${W}px;height:${H}px;pointer-events:none;`;
      camera.aspect = W / H;
      camera.position.z = (H / 2) / Math.tan((camera.fov * Math.PI) / 360);
      camera.updateProjectionMatrix();

      clearGlyphs();
      const frontLeft = front.offsetLeft, frontTop = front.offsetTop;

      lines.forEach((el, li) => {
        const text = el.getAttribute("aria-label") ?? el.dataset.text ?? el.textContent ?? "";
        const cx = frontLeft + el.offsetLeft + el.offsetWidth / 2 - h1.offsetWidth / 2;       // so với tâm h1
        const cy = frontTop + el.offsetTop + el.offsetHeight / 2 - h1.offsetHeight / 2;
        const baseY = -(cy + fs * BASELINE_K);                                                // trục y hướng lên
        const total = font.getAdvanceWidth(text, fs, { kerning: true, letterSpacing: spacing });
        const x0 = cx - total / 2;

        font.forEachGlyph(text, 0, 0, fs, { kerning: true, letterSpacing: spacing }, (glyph: opentype.Glyph, gx: number, gy: number, gfs: number) => {
          if (!glyph.path || glyph.path.commands.length === 0) return;
          const sp = new THREE.ShapePath();
          for (const c of glyph.getPath(gx, gy, gfs).commands) {
            if (c.type === "M") sp.moveTo(c.x, -c.y);
            else if (c.type === "L") sp.lineTo(c.x, -c.y);
            else if (c.type === "C") sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
            else if (c.type === "Q") sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
            else if (c.type === "Z") sp.currentPath?.closePath();
          }
          const shapes = sp.toShapes(false);
          if (!shapes.length) return;
          const geo = new THREE.ExtrudeGeometry(shapes, {
            depth, bevelEnabled: true, bevelThickness: fs * 0.014, bevelSize: fs * 0.011, bevelSegments: 3, curveSegments: 10,
          });
          geo.computeBoundingBox();
          const bb = geo.boundingBox!;
          const cxl = (bb.min.x + bb.max.x) / 2, cyl = (bb.min.y + bb.max.y) / 2;
          geo.translate(-cxl, -cyl, -depth / 2);               // tâm ở gốc để xoay/animation quanh tâm chữ
          const mesh = new THREE.Mesh(geo, mats[Math.min(li, 2)]);
          mesh.position.set(x0 + cxl, baseY + cyl, 0);
          mesh.userData.home = mesh.position.clone();
          group.add(mesh);
          glyphs.push(mesh);
        });
      });

      h1.classList.add("title3d-on");                           // ẩn bản DOM, hiện bản 3D

      if (animate) {
        // chữ lao vào từ chiều sâu, lần lượt từ trái sang phải
        glyphs.forEach((m, i) => {
          m.position.z = -1200; m.rotation.x = -1.1; m.scale.setScalar(0.6);
          gsap.to(m.position, { z: 0, duration: 1.3, ease: "expo.out", delay: 0.05 + i * 0.07 });
          gsap.to(m.rotation, { x: 0, duration: 1.3, ease: "expo.out", delay: 0.05 + i * 0.07 });
          gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: "back.out(1.5)", delay: 0.05 + i * 0.07 });
        });
      }
    };

    build(true).catch(() => { /* lỗi font/hình học → giữ nguyên bản DOM */ });

    let resizeTimer = 0;
    const onResize = () => { clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { build(false).catch(() => {}); }, 250); };
    window.addEventListener("resize", onResize);

    // Chuột: nghiêng khối chữ + đèn neon bay theo
    const mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener("mousemove", onMove, { passive: true });

    let raf = 0, visible = true;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || glyphs.length === 0) return;
      const t = performance.now() / 1000;
      sm.x += (mouse.x - sm.x) * 0.06; sm.y += (mouse.y - sm.y) * 0.06;
      group.rotation.y = sm.x * 0.22 + Math.sin(t * 0.5) * 0.03;
      group.rotation.x = sm.y * 0.12;
      group.scale.setScalar(1 + level.bass * 0.025);

      const R = 520;
      pGreen.position.set(Math.cos(t * 0.7) * R + sm.x * 260, Math.sin(t * 0.9) * 220 - sm.y * 160, 380);
      pPink.position.set(Math.cos(t * 0.6 + 2.1) * R - sm.x * 200, Math.sin(t * 0.8 + 1.3) * 240, 330);
      pCyan.position.set(Math.cos(t * 0.5 + 4.2) * R, -240 + Math.sin(t * 0.7) * 120 - sm.y * 120, 420);
      matNeon.emissiveIntensity = 0.9 + level.bass * 1.2;
      renderer.render(scene, camera);
    };
    animate();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(h1);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      io.disconnect();
      h1.classList.remove("title3d-on");
      clearGlyphs();
      disposables.forEach(d => d.dispose());
      envTex.dispose(); pmrem.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden />;
};

export default Title3D;
