import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const USER = "tykyfatkie";
const API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
const COLS = 54, ROWS = 7;
const PALETTE = ["#12231b", "#1e8a2c", "#39ff14", "#00cfff", "#ff2d78"].map(c => new THREE.Color(c));

interface Day { date: string; count: number; level: number }
interface Stats { total: number; best: number; streak: number; live: boolean }

/** Dữ liệu mẫu (cố định theo seed) dùng khi không gọi được API. */
function sampleDays(): Day[] {
  let s = 1337;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const out: Day[] = [];
  const d = new Date(); d.setDate(d.getDate() - 364);
  for (let i = 0; i < 365; i++) {
    const wk = d.getDay() % 6 === 0 ? 0.35 : 1;
    const burst = Math.sin(i / 23) > 0.55 ? 3 : 1;
    const c = rnd() < 0.55 * wk ? Math.round(rnd() * 9 * burst) : 0;
    out.push({ date: d.toISOString().slice(0, 10), count: c, level: c === 0 ? 0 : c < 3 ? 1 : c < 6 ? 2 : c < 10 ? 3 : 4 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function summarize(days: Day[], live: boolean): Stats {
  const total = days.reduce((a, d) => a + d.count, 0);
  const best = days.reduce((a, d) => Math.max(a, d.count), 0);
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) streak++;
    else if (i === days.length - 1) continue;           // hôm nay chưa commit thì vẫn tính chuỗi tới hôm qua
    else break;
  }
  return { total, best, streak, live };
}

/** Thành phố commit: mỗi cột là một ngày hoạt động trên GitHub (dữ liệu thật của tài khoản), rê chuột để xem chi tiết. */
const CommitCity = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const daysRef = useRef<Day[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const mount = mountRef.current, tip = tipRef.current;
    if (!mount || !tip) return;
    let alive = true;
    let startAt = Infinity;

    // ── dữ liệu ─────────────────────────────────────────────────────────────
    (async () => {
      let days: Day[] | null = null, live = false;
      try {
        const r = await fetch(API);
        if (r.ok) { const j = await r.json(); if (Array.isArray(j.contributions) && j.contributions.length) { days = j.contributions; live = true; } }
      } catch { /* dùng dữ liệu mẫu */ }
      if (!alive) return;
      const d = days ?? sampleDays();
      daysRef.current = d;
      setStats(summarize(d, live));
      startAt = performance.now() / 1000;   // bắt đầu animation mọc cột khi đã có dữ liệu
    })();

    // ── cảnh 3D ─────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050505, 14, 34);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    const el = renderer.domElement;

    const hemi = new THREE.HemisphereLight(0x88ffaa, 0x050510, 1.1);
    const l1 = new THREE.PointLight(0x39ff14, 80, 40), l2 = new THREE.PointLight(0xff2d78, 60, 40), l3 = new THREE.PointLight(0x00cfff, 50, 40);
    l1.position.set(-10, 8, 6); l2.position.set(10, 6, -6); l3.position.set(0, 10, 10);
    scene.add(hemi, l1, l2, l3);

    const city = new THREE.Group();
    scene.add(city);

    const CELL = 0.21, SIZE = 0.165;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const mesh = new THREE.InstancedMesh(geo, mat, COLS * ROWS);
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COLS * ROWS * 3), 3);
    city.add(mesh);

    // nền lưới + viền phát sáng
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS * CELL + 1.2, ROWS * CELL + 1.2),
      new THREE.MeshBasicMaterial({ color: 0x0a1410, transparent: true, opacity: 0.85 }),
    );
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.01;
    const grid = new THREE.GridHelper(COLS * CELL + 1.2, COLS, 0x39ff14, 0x39ff14);
    (grid.material as THREE.Material).transparent = true; (grid.material as THREE.Material).opacity = 0.08;
    grid.scale.z = (ROWS * CELL + 1.2) / (COLS * CELL + 1.2);
    city.add(floor, grid);

    const dummy = new THREE.Object3D();
    const cur = new Float32Array(COLS * ROWS);   // chiều cao hiện tại
    const tgt = new Float32Array(COLS * ROWS);   // chiều cao đích
    const cellDay: (Day | null)[] = new Array(COLS * ROWS).fill(null);
    let built = false, hovered = -1;

    const buildFromData = (days: Day[]) => {
      const start = new Date(days[0].date + "T00:00:00").getDay();
      const max = Math.max(1, ...days.map(d => d.count));
      cellDay.fill(null); tgt.fill(0);
      days.forEach((d, k) => {
        const idx = (Math.floor((start + k) / 7)) * ROWS + ((start + k) % 7);
        if (idx >= COLS * ROWS) return;
        cellDay[idx] = d;
        tgt[idx] = d.count === 0 ? 0.04 : 0.18 + (Math.log1p(d.count) / Math.log1p(max)) * 3.1;
        mesh.setColorAt(idx, PALETTE[Math.min(4, d.level)]);
      });
      for (let i = 0; i < COLS * ROWS; i++) if (!cellDay[i]) mesh.setColorAt(i, PALETTE[0]);
      mesh.instanceColor!.needsUpdate = true;
      built = true;
    };

    // ── điều khiển ──────────────────────────────────────────────────────────
    let yaw = -0.5, dragging = false, lx = 0, vel = 0, pitch = 0.0;
    const down = (e: PointerEvent) => { dragging = true; lx = e.clientX; el.setPointerCapture(e.pointerId); };
    const mv = { x: -1, y: -1, active: false };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mv.x = ((e.clientX - r.left) / r.width) * 2 - 1; mv.y = -(((e.clientY - r.top) / r.height) * 2 - 1); mv.active = true;
      tip.dataset.px = String(e.clientX - r.left); tip.dataset.py = String(e.clientY - r.top);
      if (dragging) { vel = (e.clientX - lx) * 0.006; yaw += vel; lx = e.clientX; }
    };
    const up = () => { dragging = false; };
    const leave = () => { mv.active = false; tip.style.opacity = "0"; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("pointerleave", leave);

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount); resize();

    const ray = new THREE.Raycaster();
    const fmt = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

    let raf = 0, visible = true, lastT = performance.now() / 1000;
    const tmpColor = new THREE.Color();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const now = performance.now() / 1000;
      const dt = Math.min(now - lastT, 0.05); lastT = now;

      const days = daysRef.current;
      if (days && !built) buildFromData(days);

      if (!dragging) yaw += 0.0016;

      // chiều cao: mọc dần theo "sóng" từ trái sang phải, rồi bám theo đích
      const t = now - startAt;
      for (let i = 0; i < COLS * ROWS; i++) {
        const col = Math.floor(i / ROWS);
        const k = built ? Math.min(1, Math.max(0, (t - col * 0.022) / 0.9)) : 0;
        const e = 1 - Math.pow(1 - k, 3);
        const goal = tgt[i] * e + (i === hovered ? 0.18 : 0);
        cur[i] += (goal - cur[i]) * Math.min(1, dt * 10);
        const h = Math.max(0.001, cur[i]);
        const col3 = Math.floor(i / ROWS) - COLS / 2, row3 = (i % ROWS) - ROWS / 2 + 0.5;
        dummy.position.set(col3 * CELL + CELL / 2, h / 2, row3 * CELL);
        dummy.scale.set(SIZE, h, SIZE);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;

      // camera
      const dist = 8.6;
      camera.position.set(Math.sin(yaw) * dist, 5.4 + pitch, Math.cos(yaw) * dist);
      camera.lookAt(0, 0.5, 0);

      // hover
      let hit = -1;
      if (mv.active && built && !dragging) {
        ray.setFromCamera(new THREE.Vector2(mv.x, mv.y), camera);
        const r = ray.intersectObject(mesh)[0];
        if (r && r.instanceId !== undefined) hit = r.instanceId;
      }
      if (hit !== hovered) {
        if (hovered >= 0 && cellDay[hovered]) mesh.setColorAt(hovered, PALETTE[Math.min(4, cellDay[hovered]!.level)]);
        hovered = hit;
        if (hit >= 0) { mesh.setColorAt(hit, tmpColor.set("#ffffff")); }
        mesh.instanceColor!.needsUpdate = true;
        const d = hit >= 0 ? cellDay[hit] : null;
        if (d) {
          tip.innerHTML = `<b>${d.count}</b> contribution${d.count === 1 ? "" : "s"}<span>${fmt.format(new Date(d.date + "T00:00:00"))}</span>`;
          tip.style.opacity = "1";
        } else tip.style.opacity = "0";
      }
      if (hovered >= 0) {
        tip.style.transform = `translate(${Number(tip.dataset.px) + 14}px, ${Number(tip.dataset.py) - 12}px)`;
      }

      renderer.render(scene, camera);
    };
    animate();

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(mount);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("pointerleave", leave);
      geo.dispose(); mat.dispose(); mesh.dispose(); floor.geometry.dispose(); (floor.material as THREE.Material).dispose();
      grid.geometry.dispose(); (grid.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.forceContextLoss();   // trả WebGL context cho trình duyệt (dispose() không làm việc này)
      if (mount.contains(el)) mount.removeChild(el);
    };
  }, []);

  return (
    <div className="cc">
      <div className="cc__stats">
        <div><b>{stats ? stats.total.toLocaleString() : "—"}</b><span>contributions · last year</span></div>
        <div><b>{stats ? stats.best : "—"}</b><span>best day</span></div>
        <div><b>{stats ? stats.streak : "—"}</b><span>day streak</span></div>
        <em>{stats ? (stats.live ? `● live from github.com/${USER}` : "○ sample data (GitHub unreachable)") : "loading…"}</em>
      </div>
      <div className="cc__stage">
        <div ref={mountRef} className="cc__canvas" data-cursor="DRAG" />
        <div ref={tipRef} className="cc__tip" />
      </div>
    </div>
  );
};

export default CommitCity;
