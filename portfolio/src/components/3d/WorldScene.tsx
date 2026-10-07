import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { useDeck } from "../ui/SlideDeck";
import { level } from "../../lib/music";

/**
 * Một thế giới 3D duy nhất nằm sau mọi slide: đường hầm vòng neon dài xuyên qua 5 "trạm" (mỗi slide một trạm).
 * Chuyển slide = camera bay thật từ trạm này sang trạm kia (kèm giật FOV và nghiêng thân khi tăng tốc).
 * Slide có nền trong suốt nên thế giới này lộ ra phía sau nội dung. Hero tự che kín nên scene tạm dừng khi ở hero.
 */
const STEP = 70;                       // khoảng cách giữa hai trạm
const COLORS = [0x39ff14, 0x00cfff, 0xff2d78, 0xffd700, 0x39ff14];

const WorldScene = () => {
  const { index, ids } = useDeck();
  const mountRef = useRef<HTMLDivElement>(null);
  const state = useRef({ t: index, roll: 0, fov: 52, moving: false, index });

  // Đổi slide → camera bay
  useEffect(() => {
    const s = state.current;
    if (s.index === index) return;
    const dir = index > s.index ? 1 : -1;
    s.index = index;
    s.moving = true;
    const dist = Math.abs(index - s.t);
    gsap.killTweensOf(s);
    gsap.to(s, { t: index, duration: 1.5 + Math.min(dist - 1, 3) * 0.25, ease: "power3.inOut", onComplete: () => { s.moving = false; } });
    gsap.timeline()
      .to(s, { fov: 84, roll: dir * 0.14, duration: 0.7, ease: "power2.out" })
      .to(s, { fov: 52, roll: 0, duration: 0.9, ease: "power2.inOut" });
  }, [index]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const N = ids.length;
    const s = state.current;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.024);
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T { disposables.push(d); return d; }

    const mats = COLORS.map(c => track(new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })));
    const lineMats = COLORS.map(c => track(new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending, depthWrite: false })));

    // ── đường hầm vòng neon dọc suốt hành trình ──
    const ringGeo = track(new THREE.TorusGeometry(26, 0.06, 6, 96));
    const rings: THREE.Mesh[] = [];
    const total = (N - 1) * STEP + 60;
    for (let z = 20, i = 0; z > -total; z -= 7, i++) {
      const m = new THREE.Mesh(ringGeo, mats[Math.min(N - 1, Math.max(0, Math.round(-z / STEP))) % COLORS.length]);
      m.position.z = z;
      m.rotation.z = i * 0.21;
      scene.add(m);
      rings.push(m);
    }

    // ── bụi sao ──
    const count = 4500, pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = 5 + Math.pow(Math.random(), 0.6) * 30;
      pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = Math.sin(a) * r; pos[i * 3 + 2] = 25 - Math.random() * (total + 50);
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(dustGeo, track(new THREE.PointsMaterial({ color: 0xcfffe0, size: 0.11, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }))));

    // ── công trình ở từng trạm (nằm hai bên, né vùng giữa chỗ nội dung) ──
    const spinners: { m: THREE.Object3D; v: THREE.Vector3 }[] = [];
    const addSpin = (m: THREE.Object3D, sp = 0.2) => spinners.push({ m, v: new THREE.Vector3(sp * (0.5 + Math.random()), sp * (0.5 + Math.random()), 0) });
    const wire = (geo: THREE.BufferGeometry, mat: THREE.LineBasicMaterial) => new THREE.LineSegments(track(new THREE.EdgesGeometry(geo)), mat);

    for (let i = 1; i < N; i++) {
      const z = -i * STEP;
      const g = new THREE.Group(); g.position.z = z; scene.add(g);
      const lm = lineMats[i % COLORS.length];

      if (i === 1) {                                 // About: vòng quỹ đạo khổng lồ + khối đa diện
        [-17, 17].forEach((x, k) => {
          const ico = wire(track(new THREE.IcosahedronGeometry(5.5, 1)), lm); ico.position.set(x, k ? -4 : 5, -6); g.add(ico); addSpin(ico);
          const ring = new THREE.Mesh(track(new THREE.TorusGeometry(8, 0.07, 6, 80)), mats[i]); ring.position.copy(ico.position); ring.rotation.x = 1.1; g.add(ring); addSpin(ring, 0.25);
        });
      } else if (i === 2) {                          // Skills: lưới khối tám mặt
        for (let k = 0; k < 14; k++) {
          const o = wire(track(new THREE.OctahedronGeometry(1.2 + Math.random() * 1.6, 0)), lm);
          const side = k % 2 ? 1 : -1;
          o.position.set(side * (9 + Math.random() * 12), (Math.random() - 0.5) * 18, -Math.random() * 16);
          g.add(o); addSpin(o, 0.5);
        }
      } else if (i === 3) {                          // Projects: các "màn hình" bay thành vòng cung
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const panel = wire(track(new THREE.PlaneGeometry(7, 4.4)), lm);
          panel.position.set(Math.cos(a) * 22, Math.sin(a) * 13, -8 - (k % 3) * 4);
          panel.lookAt(0, 0, 8);
          g.add(panel);
          const inner = new THREE.Mesh(track(new THREE.PlaneGeometry(6.4, 3.8)), track(new THREE.MeshBasicMaterial({ color: COLORS[i], transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false })));
          inner.position.copy(panel.position); inner.quaternion.copy(panel.quaternion); g.add(inner);
        }
      } else {                                       // Contact: cổng không gian ở cuối hành trình
        const portal = wire(track(new THREE.IcosahedronGeometry(16, 2)), lm); portal.position.set(0, 0, -34); g.add(portal); addSpin(portal, 0.06);
        for (let k = 1; k <= 4; k++) { const r = new THREE.Mesh(track(new THREE.TorusGeometry(6 + k * 5, 0.08, 6, 96)), mats[i]); r.position.z = -34 - k * 3; g.add(r); }
      }
    }

    // ── điều khiển ──
    const mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener("mousemove", onMove, { passive: true });
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    resize();

    let raf = 0, last = performance.now(), pulse = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      // Ở hero (che kín toàn màn hình) và không đang bay thì không cần vẽ
      if (s.index === 0 && !s.moving && s.t < 0.02) return;

      sm.x += (mouse.x - sm.x) * 0.05; sm.y += (mouse.y - sm.y) * 0.05;
      pulse += (level.bass - pulse) * (level.bass > pulse ? 0.5 : 0.08);

      camera.position.set(sm.x * 2.2, -sm.y * 1.4 + Math.sin(s.t * Math.PI) * 1.2, 14 - s.t * STEP);
      camera.rotation.set(0, -sm.x * 0.04, s.roll);
      if (camera.fov !== s.fov) { camera.fov = s.fov; camera.updateProjectionMatrix(); }

      rings.forEach((r, i) => { r.rotation.z += dt * 0.08 * (i % 2 ? 1 : -1); r.scale.setScalar(1 + pulse * 0.08); });
      spinners.forEach(({ m, v }) => { m.rotation.x += v.x * dt; m.rotation.y += v.y * dt; m.scale.setScalar(1 + pulse * 0.1); });
      mats.forEach(m => { m.opacity = 0.3 + pulse * 0.25; });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      gsap.killTweensOf(s);
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [ids.length]);

  return <div ref={mountRef} className="world" aria-hidden />;
};

export default WorldScene;
