import { useEffect, useRef } from "react";
import * as THREE from "three";
import { level } from "../../lib/music";
import { lineFlasher } from "../../lib/flash";

/**
 * Cảnh 3D của hero: các khối viền neon (có lõi đặc tối để che khuất nhau) trôi ở nhiều độ sâu quanh khối chữ,
 * một đường hầm vòng tròn lùi xa dần trong sương mù, camera lắc theo chuột, mọi thứ "đập" theo bass của nhạc.
 */
const HeroShapes = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 9, 34);
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T { disposables.push(d); return d; }

    const COLORS = [0x39ff14, 0xff2d78, 0x00cfff, 0xffd700, 0xa855f7];
    const geos = [
      track(new THREE.IcosahedronGeometry(1, 0)),
      track(new THREE.OctahedronGeometry(1.1, 0)),
      track(new THREE.BoxGeometry(1.4, 1.4, 1.4)),
      track(new THREE.TetrahedronGeometry(1.2, 0)),
      track(new THREE.TorusGeometry(0.9, 0.3, 10, 24)),
      track(new THREE.TorusKnotGeometry(0.7, 0.22, 90, 12)),
      track(new THREE.DodecahedronGeometry(1, 0)),
    ];
    const solid = track(new THREE.MeshBasicMaterial({ color: 0x050505 }));

    type Item = { g: THREE.Group; base: THREE.Vector3; speed: number; phase: number; size: number; spin: THREE.Vector3 };
    const items: Item[] = [];
    // vị trí cố định, né vùng giữa (chỗ khối chữ): x lệch hai bên, z từ gần đến xa
    const slots: [number, number, number, number][] = [
      [-6.2,  2.6,  1.5, 1.1], [ 6.6,  2.2,  0.5, 0.9], [-8.4, -1.6, -2.5, 1.5], [ 8.8, -2.0, -3.5, 1.6],
      [-4.4, -3.9,  3.0, 0.8], [ 4.6, -3.7,  2.2, 0.75], [-10.5, 2.8, -7.0, 2.0], [10.8, 3.2, -8.0, 2.1],
      [ 0.0,  5.6, -6.0, 1.2], [-2.2, -6.0, -3.0, 0.9],
    ];
    slots.forEach(([x, y, z, size], i) => {
      const color = COLORS[i % COLORS.length];
      const geo = geos[i % geos.length];
      const g = new THREE.Group();
      const core = new THREE.Mesh(geo, solid);
      core.scale.setScalar(0.985);
      const edges = new THREE.LineSegments(
        track(new THREE.EdgesGeometry(geo)),
        track(new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })),
      );
      g.add(core, edges);
      g.position.set(x, y, z);
      g.scale.setScalar(size);
      g.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      scene.add(g);
      items.push({
        g, base: new THREE.Vector3(x, y, z), size,
        speed: 0.25 + Math.random() * 0.5, phase: Math.random() * 6,
        spin: new THREE.Vector3(0.1 + Math.random() * 0.3, 0.15 + Math.random() * 0.35, 0),
      });
    });

    // Đường hầm vòng tròn: lùi xa dần, tự bay về phía camera rồi quay vòng lại
    const ringGeo = track(new THREE.TorusGeometry(7.5, 0.02, 8, 160));
    const rings: { m: THREE.Mesh; z: number }[] = [];
    const RING_N = 7, SPAN = 36;
    for (let i = 0; i < RING_N; i++) {
      const mat = track(new THREE.MeshBasicMaterial({ color: i % 2 ? 0x00cfff : 0x39ff14, transparent: true, opacity: 0.7 }));
      const m = new THREE.Mesh(ringGeo, mat);
      const z = -SPAN + (i / RING_N) * SPAN;
      m.position.z = z;
      scene.add(m);
      rings.push({ m, z });
    }

    const flashLines = lineFlasher(scene, { whiten: 0.6 });   // cạnh khối + vòng hầm chớp sáng theo nhịp bass
    const mouse = { x: 0, y: 0 }, smooth = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

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

    let raf = 0, visible = true, last = performance.now(), pulse = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) { last = performance.now(); return; }
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const t = now / 1000;
      smooth.x += (mouse.x - smooth.x) * 0.05;
      smooth.y += (mouse.y - smooth.y) * 0.05;

      // "đập" theo bass: tăng nhanh, giảm chậm
      pulse += (level.bass - pulse) * (level.bass > pulse ? 0.5 : 0.08);

      camera.position.x = smooth.x * 2.2;
      camera.position.y = -smooth.y * 1.4;
      camera.lookAt(0, 0, 0);

      items.forEach(({ g, base, speed, phase, size, spin }) => {
        g.rotation.x += spin.x * dt * (1 + pulse * 3);
        g.rotation.y += spin.y * dt * (1 + pulse * 3);
        g.position.y = base.y + Math.sin(t * speed + phase) * 0.55;
        g.position.x = base.x + Math.cos(t * speed * 0.7 + phase) * 0.25;
        g.scale.setScalar(size * (1 + pulse * 0.35));
      });

      rings.forEach(r => {
        r.z += dt * (2.2 + pulse * 5);
        if (r.z > 8) r.z -= SPAN + 8;
        r.m.position.z = r.z;
        r.m.rotation.z = t * 0.1 + r.z * 0.05;
        r.m.scale.setScalar(1 + pulse * 0.06);
      });

      flashLines(level.flash);
      renderer.render(scene, camera);
    };
    animate();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
      io.disconnect();
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();   // trả WebGL context cho trình duyệt (dispose() không làm việc này)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
};

export default HeroShapes;
