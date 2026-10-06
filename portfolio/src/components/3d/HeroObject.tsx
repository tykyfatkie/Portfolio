import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Vật thể wireframe 3D ở hero: icosahedron + torus knot + vòng quỹ đạo, phản ứng với chuột và cuộn. */
const HeroObject = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduce = false; // luôn chạy animation (chủ ý của chủ site)

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.z = 9.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T {
      disposables.push(d);
      return d;
    }

    // Icosahedron cạnh sáng
    const icoGeo = track(new THREE.IcosahedronGeometry(2, 1));
    const ico = new THREE.LineSegments(
      track(new THREE.EdgesGeometry(icoGeo)),
      track(new THREE.LineBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.55 })),
    );
    group.add(ico);

    // Đỉnh phát sáng
    const verts = new THREE.Points(
      icoGeo,
      track(new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.9 })),
    );
    group.add(verts);

    // Torus knot lõi
    const knot = new THREE.Mesh(
      track(new THREE.TorusKnotGeometry(0.8, 0.25, 180, 24)),
      track(new THREE.MeshBasicMaterial({ color: 0xff2d78, wireframe: true, transparent: true, opacity: 0.45 })),
    );
    group.add(knot);

    // Hai vòng quỹ đạo + vệ tinh
    const ringMat = track(new THREE.MeshBasicMaterial({ color: 0x00cfff, transparent: true, opacity: 0.6 }));
    const ringGeo = track(new THREE.TorusGeometry(2.9, 0.01, 8, 160));
    const rings: THREE.Group[] = [];
    [0.9, -0.6].forEach((tilt, i) => {
      const g = new THREE.Group();
      g.rotation.x = Math.PI / 2 + tilt;
      g.rotation.y = i * 0.8;
      g.add(new THREE.Mesh(ringGeo, ringMat));
      const sat = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.09, 16, 16)),
        track(new THREE.MeshBasicMaterial({ color: i ? 0x39ff14 : 0xffd700 })),
      );
      sat.userData.speed = 0.6 + i * 0.4;
      g.add(sat);
      group.add(g);
      rings.push(g);
    });

    // Bụi sao quanh vật thể
    const N = 400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 3.5 + Math.random() * 3;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(
      dustGeo,
      track(new THREE.PointsMaterial({ color: 0x00cfff, size: 0.03, transparent: true, opacity: 0.6 })),
    );
    group.add(dust);

    // Điều khiển chuột
    const mouse = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0 };
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
      smooth.x += (mouse.x - smooth.x) * 0.05;
      smooth.y += (mouse.y - smooth.y) * 0.05;

      ico.rotation.set(t * 0.12 + smooth.y * 0.5, t * 0.18 + smooth.x * 0.6, 0);
      verts.rotation.copy(ico.rotation);
      knot.rotation.set(t * 0.3, t * 0.4, t * 0.1);
      knot.scale.setScalar(1 + Math.sin(t * 1.2) * 0.06);
      dust.rotation.y = t * 0.03;
      rings.forEach((g, i) => {
        g.rotation.z = t * (0.15 + i * 0.1);
        const sat = g.children[1] as THREE.Mesh;
        const a = t * sat.userData.speed;
        sat.position.set(Math.cos(a) * 2.9, Math.sin(a) * 2.9, 0);
      });
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
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1, opacity: 0.6 }}
    />
  );
};

export default HeroObject;
