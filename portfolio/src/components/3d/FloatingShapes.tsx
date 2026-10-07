import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Các khối wireframe trôi nổi + parallax chuột, dùng làm nền section Contact. */
const FloatingShapes = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = false; // luôn chạy animation (chủ ý của chủ site)

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60);
    camera.position.z = 12;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const geos = [
      new THREE.IcosahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.8, 0.28, 12, 32),
      new THREE.TetrahedronGeometry(1.1, 0),
      new THREE.TorusKnotGeometry(0.6, 0.18, 80, 12),
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
    ];
    const colors = [0x39ff14, 0xff2d78, 0x00cfff, 0xffd700];
    const mats: THREE.Material[] = [];
    const items: { m: THREE.Mesh; baseY: number; speed: number; phase: number }[] = [];

    for (let i = 0; i < 14; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colors[i % colors.length], wireframe: true, transparent: true, opacity: 0.35 });
      mats.push(mat);
      const m = new THREE.Mesh(geos[i % geos.length], mat);
      const side = i % 2 ? 1 : -1;
      m.position.set(side * (3 + Math.random() * 7), (Math.random() - 0.5) * 9, -4 + Math.random() * 6);
      m.scale.setScalar(0.5 + Math.random() * 0.9);
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      scene.add(m);
      items.push({ m, baseY: m.position.y, speed: 0.2 + Math.random() * 0.5, phase: Math.random() * 6 });
    }

    const mouse = { x: 0, y: 0 };
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

    let raf = 0, visible = true;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const t = reduce ? 0 : clock.getElapsedTime();
      const spin = reduce ? 0 : 1;
      items.forEach(({ m, baseY, speed, phase }) => {
        m.rotation.x += 0.004 * speed * spin;
        m.rotation.y += 0.006 * speed * spin;
        m.position.y = baseY + Math.sin(t * speed + phase) * 0.6;
      });
      camera.position.x += (mouse.x * 1.5 - camera.position.x) * 0.04;
      camera.position.y += (-mouse.y * 1.0 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
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
      geos.forEach(g => g.dispose());
      mats.forEach(m => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();   // trả WebGL context cho trình duyệt (dispose() không làm việc này)
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
};

export default FloatingShapes;
