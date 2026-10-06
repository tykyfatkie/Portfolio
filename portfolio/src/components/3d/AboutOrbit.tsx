import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Vòng quỹ đạo 3D + hạt sáng phía sau thẻ hồ sơ; phản ứng với chuột để tạo chiều sâu. */
const AboutOrbit = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.z = 10;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T { disposables.push(d); return d; }

    const group = new THREE.Group();
    scene.add(group);

    // Ba vòng quỹ đạo nghiêng khác nhau, mỗi vòng có một vệ tinh
    const specs = [
      { r: 3.6, color: 0x39ff14, tilt: [1.2, 0.2], speed: 0.35 },
      { r: 4.3, color: 0x00cfff, tilt: [0.5, 0.9], speed: -0.25 },
      { r: 5.0, color: 0xff2d78, tilt: [-0.7, 0.4], speed: 0.18 },
    ];
    const rings: { g: THREE.Group; sat: THREE.Mesh; speed: number; r: number }[] = [];
    specs.forEach(sp => {
      const g = new THREE.Group();
      g.rotation.set(sp.tilt[0], sp.tilt[1], 0);
      const ring = new THREE.Mesh(
        track(new THREE.TorusGeometry(sp.r, 0.012, 8, 220)),
        track(new THREE.MeshBasicMaterial({ color: sp.color, transparent: true, opacity: 0.55 })),
      );
      const sat = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.12, 20, 20)),
        track(new THREE.MeshBasicMaterial({ color: sp.color })),
      );
      // quầng sáng quanh vệ tinh
      const halo = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.28, 20, 20)),
        track(new THREE.MeshBasicMaterial({ color: sp.color, transparent: true, opacity: 0.18 })),
      );
      sat.add(halo);
      g.add(ring, sat);
      group.add(g);
      rings.push({ g, sat, speed: sp.speed, r: sp.r });
    });

    // Vỏ hạt: các điểm sáng phân bố trên mặt cầu lớn → cảm giác không gian
    const N = 500, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 5.5 + Math.random() * 2.5, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const dustGeo = track(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, track(new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.55 })));
    group.add(dust);

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

    let raf = 0, visible = true;
    const clock = new THREE.Clock();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const t = clock.getElapsedTime();
      smooth.x += (mouse.x - smooth.x) * 0.05;
      smooth.y += (mouse.y - smooth.y) * 0.05;
      group.rotation.y = t * 0.08 + smooth.x * 0.5;
      group.rotation.x = smooth.y * 0.35;
      dust.rotation.y = -t * 0.04;
      rings.forEach(({ g, sat, speed, r }, i) => {
        g.rotation.z = t * speed;
        const a = t * (0.8 + i * 0.3);
        sat.position.set(Math.cos(a) * r, Math.sin(a) * r, 0);
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

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />;
};

export default AboutOrbit;
