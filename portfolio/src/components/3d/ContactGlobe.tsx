import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { level } from "../../lib/music";

export interface GlobeHandle { transmit: () => void }

const DEG = Math.PI / 180;
const R = 2.4;
const HOME = { lat: 10.82, lon: 106.63 };   // TP. Hồ Chí Minh
const CITIES = [
  { n: "Singapore", lat: 1.35, lon: 103.82 }, { n: "Tokyo", lat: 35.68, lon: 139.69 }, { n: "Sydney", lat: -33.87, lon: 151.21 },
  { n: "London", lat: 51.5, lon: -0.12 },     { n: "San Francisco", lat: 37.77, lon: -122.42 }, { n: "Dubai", lat: 25.2, lon: 55.27 },
];

const toVec = (lat: number, lon: number, r = R) =>
  new THREE.Vector3(r * Math.cos(lat * DEG) * Math.sin(lon * DEG), r * Math.sin(lat * DEG), r * Math.cos(lat * DEG) * Math.cos(lon * DEG));

/** Cung tròn lớn nối a→b, nâng lên khỏi mặt cầu ở giữa đường. */
function arc(a: THREE.Vector3, b: THREE.Vector3, lift = 0.3, n = 72) {
  const ua = a.clone().normalize(), ub = b.clone().normalize();
  const ang = ua.angleTo(ub), s = Math.sin(ang) || 1;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const v = ua.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(ub.clone().multiplyScalar(Math.sin(t * ang) / s));
    pts.push(v.multiplyScalar(R * (1 + lift * Math.sin(Math.PI * t) * Math.min(1, ang))));
  }
  return pts;
}

const makeLabel = (text: string, color: string) => {
  const c = document.createElement("canvas");
  c.width = 640; c.height = 96;
  const x = c.getContext("2d")!;
  x.font = "700 40px 'JetBrains Mono', monospace";
  x.textAlign = "left"; x.textBaseline = "middle";
  x.shadowColor = color; x.shadowBlur = 18; x.fillStyle = color;
  x.fillText(text, 8, 48);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** Địa cầu hologram: chấm neon chỉ trên đất liền, đánh dấu TP.HCM, cung truyền tín hiệu đến các thành phố; `handle.transmit()` bắn một gói tin về TP.HCM. */
const ContactGlobe = ({ handle }: { handle: MutableRefObject<GlobeHandle | null> }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let alive = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
    camera.position.z = 8.6;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const disposables: { dispose(): void }[] = [];
    function track<T extends { dispose(): void }>(d: T): T { disposables.push(d); return d; }

    const globe = new THREE.Group();
    scene.add(globe);

    // Lõi tối che các chấm ở mặt sau + quầng sáng Fresnel
    globe.add(new THREE.Mesh(track(new THREE.SphereGeometry(R * 0.985, 48, 48)), track(new THREE.MeshBasicMaterial({ color: 0x030a06 }))));
    const atmos = new THREE.Mesh(
      track(new THREE.SphereGeometry(R * 1.16, 48, 48)),
      track(new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.62 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); gl_FragColor = vec4(0.22,1.0,0.35,1.0) * i * 0.9; }",
      })),
    );
    scene.add(atmos);

    // Điểm đất liền lấy mẫu từ ảnh mặt nạ (đen = đất, trắng = biển)
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const c = document.createElement("canvas");
      c.width = 1024; c.height = 512;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0, 1024, 512);
      const data = cx.getImageData(0, 0, 1024, 512).data;
      const pos: number[] = [];
      const step = 1.5;
      for (let lat = -78; lat <= 84; lat += step) {
        const lonStep = step / Math.max(0.25, Math.cos(lat * DEG));
        for (let lon = -180; lon < 180; lon += lonStep) {
          const u = Math.floor(((lon + 180) / 360) * 1023), v = Math.floor(((90 - lat) / 180) * 511);
          if (data[(v * 1024 + u) * 4] < 110) { const p = toVec(lat, lon, R * 1.003); pos.push(p.x, p.y, p.z); }
        }
      }
      const g = track(new THREE.BufferGeometry());
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      globe.add(new THREE.Points(g, track(new THREE.PointsMaterial({ color: 0x39ff14, size: 0.034, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }))));
    };
    img.src = "/images/earth-mask.jpg";

    // Vĩ tuyến/kinh tuyến mờ
    const gridMat = track(new THREE.LineBasicMaterial({ color: 0x00cfff, transparent: true, opacity: 0.1 }));
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts: THREE.Vector3[] = [];
      for (let lon = 0; lon <= 360; lon += 6) pts.push(toVec(lat, lon, R * 1.001));
      const g = track(new THREE.BufferGeometry().setFromPoints(pts));
      globe.add(new THREE.Line(g, gridMat));
    }

    // Điểm đánh dấu TP.HCM: chùm sáng + vòng sóng lan
    const home = toVec(HOME.lat, HOME.lon);
    const homeN = home.clone().normalize();
    const marker = new THREE.Group();
    marker.position.copy(home);
    marker.lookAt(home.clone().multiplyScalar(2));
    const dot = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 16, 16)), track(new THREE.MeshBasicMaterial({ color: 0xff2d78 })));
    const beam = new THREE.Mesh(track(new THREE.CylinderGeometry(0.012, 0.012, 0.9, 8)), track(new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending })));
    beam.rotation.x = Math.PI / 2; beam.position.z = 0.45;
    const ringGeo = track(new THREE.RingGeometry(0.08, 0.1, 40));
    const rings = [0, 1].map(() => {
      const m = new THREE.Mesh(ringGeo, track(new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })));
      marker.add(m);
      return m;
    });
    marker.add(dot, beam);
    globe.add(marker);

    const labelTex = makeLabel("HO CHI MINH CITY", "#ff7aa8");
    disposables.push(labelTex);
    const label = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false })));
    label.scale.set(2.5, 0.375, 1);
    label.center.set(0, 0.5);
    label.position.copy(homeN.clone().multiplyScalar(R * 1.28));
    globe.add(label);

    // Các cung tín hiệu + hạt chạy dọc cung
    const curves = CITIES.map((c, i) => {
      const pts = arc(home, toVec(c.lat, c.lon), 0.32);
      const g = track(new THREE.BufferGeometry().setFromPoints(pts));
      globe.add(new THREE.Line(g, track(new THREE.LineBasicMaterial({ color: i % 2 ? 0x00cfff : 0x39ff14, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending }))));
      const pk = new THREE.Mesh(track(new THREE.SphereGeometry(0.045, 10, 10)), track(new THREE.MeshBasicMaterial({ color: 0xffffff })));
      globe.add(pk);
      return { curve: new THREE.CatmullRomCurve3(pts), pk, phase: i / CITIES.length, speed: 0.12 + i * 0.012 };
    });
    const cityDots = CITIES.map(c => {
      const m = new THREE.Mesh(track(new THREE.SphereGeometry(0.04, 10, 10)), track(new THREE.MeshBasicMaterial({ color: 0x00cfff })));
      m.position.copy(toVec(c.lat, c.lon, R * 1.005));
      globe.add(m);
      return m;
    });
    void cityDots;

    // Gói tin gửi từ form: bay từ phía "người dùng" (mặt trước địa cầu, bên trái) về TP.HCM
    type Packet = { curve: THREE.CatmullRomCurve3; mesh: THREE.Mesh; trail: THREE.Mesh[]; t0: number; dur: number };
    const packets: Packet[] = [];
    let flash = 0;
    handle.current = {
      transmit: () => {
        const from = toVec(18, HOME.lon - 62);
        const pts = arc(from, home, 0.55, 90);
        const mesh = new THREE.Mesh(track(new THREE.SphereGeometry(0.1, 16, 16)), track(new THREE.MeshBasicMaterial({ color: 0xffffff })));
        const trail = Array.from({ length: 14 }, (_, i) => {
          const m = new THREE.Mesh(track(new THREE.SphereGeometry(0.075 - i * 0.004, 10, 10)), track(new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, opacity: 0.6 - i * 0.04, blending: THREE.AdditiveBlending, depthWrite: false })));
          globe.add(m);
          return m;
        });
        globe.add(mesh);
        packets.push({ curve: new THREE.CatmullRomCurve3(pts), mesh, trail, t0: performance.now() / 1000, dur: 1.7 });
      },
    };

    // Điều khiển: kéo xoay + parallax chuột
    let dragging = false, lx = 0, userYaw = 0, userVel = 0, ly = 0, userPitch = 0;
    const el = renderer.domElement;
    el.style.touchAction = "pan-y";
    const down = (e: PointerEvent) => { dragging = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      userVel = (e.clientX - lx) * 0.006; userYaw += userVel; userPitch = THREE.MathUtils.clamp(userPitch + (e.clientY - ly) * 0.004, -0.6, 0.6);
      lx = e.clientX; ly = e.clientY;
    };
    const up = () => { dragging = false; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    const mouse = { x: 0, y: 0 }, sm = { x: 0, y: 0 };
    const onMouse = (e: MouseEvent) => { mouse.x = (e.clientX / window.innerWidth - 0.5) * 2; mouse.y = (e.clientY / window.innerHeight - 0.5) * 2; };
    window.addEventListener("mousemove", onMouse, { passive: true });

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
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const now = performance.now() / 1000;
      sm.x += (mouse.x - sm.x) * 0.05; sm.y += (mouse.y - sm.y) * 0.05;
      if (!dragging) userYaw *= 0.985;

      // quay quanh Việt Nam (dao động) thay vì quay hết vòng để điểm đánh dấu luôn nằm trong tầm nhìn
      globe.rotation.y = -HOME.lon * DEG + Math.sin(now * 0.18) * 0.55 + userYaw + sm.x * 0.25;
      globe.rotation.x = 0.28 + sm.y * 0.15 + userPitch;
      atmos.scale.setScalar(1 + level.bass * 0.05);

      // vòng sóng ở TP.HCM + chớp khi gói tin tới nơi
      rings.forEach((m, i) => {
        const t = ((now * 0.55 + i * 0.5) % 1);
        m.scale.setScalar(1 + t * 7);
        (m.material as THREE.MeshBasicMaterial).opacity = (1 - t) * (0.7 + flash);
      });
      (beam.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.2 * Math.sin(now * 3) + flash * 0.6;
      dot.scale.setScalar(1 + flash * 1.8 + 0.15 * Math.sin(now * 5));
      flash *= 0.94;

      curves.forEach(c => { const t = (now * c.speed + c.phase) % 1; c.pk.position.copy(c.curve.getPoint(t)); });

      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        const t = (now - p.t0) / p.dur;
        if (t >= 1) {
          flash = 1;
          p.mesh.removeFromParent(); p.trail.forEach(m => m.removeFromParent());
          packets.splice(i, 1);
          continue;
        }
        const e = t * t * (3 - 2 * t);
        p.mesh.position.copy(p.curve.getPoint(e));
        p.trail.forEach((m, k) => m.position.copy(p.curve.getPoint(Math.max(0, e - (k + 1) * 0.018))));
      }

      renderer.render(scene, camera);
    };
    animate();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(mount);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      ro.disconnect(); io.disconnect();
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      handle.current = null;
      disposables.forEach(d => d.dispose());
      renderer.dispose();
      renderer.forceContextLoss();   // trả WebGL context cho trình duyệt (dispose() không làm việc này)
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, [handle]);

  return <div ref={mountRef} data-cursor="DRAG" className="contact-globe" />;
};

export default ContactGlobe;
