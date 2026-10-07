import * as THREE from "three";

/**
 * Làm các đường nét của một cảnh 3D chớp sáng theo nhịp bass.
 * Gom các LineBasicMaterial (và MeshBasicMaterial trong suốt nếu không bật linesOnly) đang có trong `root`,
 * nhớ màu/độ mờ gốc; mỗi frame gọi apply(flash, pulse) để: độ mờ = gốc × (1 + flash·1.2 + pulse·0.5), màu ngả về trắng theo flash.
 * Chỉ các vật liệu có mặt lúc tạo mới được điều khiển (vật liệu đổi màu động thì tạo sau khi gọi hàm này).
 */
export function lineFlasher(root: THREE.Object3D, opts: { linesOnly?: boolean; whiten?: number } = {}) {
  const { linesOnly = false, whiten = 0.55 } = opts;
  type M = THREE.LineBasicMaterial | THREE.MeshBasicMaterial;
  const items: { m: M; base: THREE.Color; op: number }[] = [];
  const seen = new Set<THREE.Material>();
  root.traverse(o => {
    const mat = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    for (const m of Array.isArray(mat) ? mat : mat ? [mat] : []) {
      if (seen.has(m)) continue;
      const isLine = m instanceof THREE.LineBasicMaterial;
      const isGlowMesh = !linesOnly && m instanceof THREE.MeshBasicMaterial && m.transparent;
      if (!isLine && !isGlowMesh) continue;
      seen.add(m);
      const mm = m as M;
      mm.transparent = true;
      items.push({ m: mm, base: mm.color.clone(), op: mm.opacity });
    }
  });
  const white = new THREE.Color(1, 1, 1);
  let lastKey = -1;
  return (flash: number, pulse = 0) => {
    const key = Math.round(flash * 100) * 1000 + Math.round(pulse * 100);
    if (key === lastKey) return;                 // không đổi thì khỏi cập nhật
    lastKey = key;
    for (const it of items) {
      it.m.color.copy(it.base).lerp(white, flash * whiten);
      it.m.opacity = Math.min(1, it.op * (1 + flash * 1.2 + pulse * 0.5));
    }
  };
}
