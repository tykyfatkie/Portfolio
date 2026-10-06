/**
 * Tải trước toàn bộ tài nguyên nặng trước khi mở trang chính:
 *  - JS chunk của các canvas 3D (lazy)
 *  - Font
 *  - Ảnh project (tải + decode)
 *  - Nhạc nền (blob URL, dùng lại ở useBackgroundMusic)
 * Tiến độ được tính theo trọng số, ảnh và nhạc tính theo byte thực tế.
 */

export const assets = {
  /** URL nhạc nền; được thay bằng blob URL sau khi preload xong. */
  music: "/theme.mp3",
};

const IMAGES = [
  "/images/projects/mommilk.png",
  "/images/projects/mome.png",
  "/images/projects/orchid.png",
  "/images/projects/ai-chatbox.png",
  "/images/projects/cvs.png",
  "/images/projects/cgts.png",
];

const FONTS = [
  "1em 'Bebas Neue'",
  "300 1em 'DM Sans'",
  "400 1em 'DM Sans'",
  "500 1em 'DM Sans'",
  "400 1em 'JetBrains Mono'",
  "700 1em 'JetBrains Mono'",
];

type Task = { label: string; weight: number; run: (report: (frac: number) => void) => Promise<void> };

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<void>(r => setTimeout(r, ms))]);

/** fetch có báo tiến độ theo byte; lỗi mạng → trả null (không chặn trang). */
async function fetchBlob(url: string, report: (frac: number) => void): Promise<Blob | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const total = Number(res.headers.get("content-length")) || 0;
    if (!res.body || !total) { const b = await res.blob(); report(1); return b; }
    const reader = res.body.getReader();
    const chunks: BlobPart[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value as BlobPart);
      got += value.length;
      report(Math.min(got / total, 1));
    }
    report(1);
    return new Blob(chunks, { type: res.headers.get("content-type") ?? undefined });
  } catch {
    report(1);
    return null;
  }
}

const tasks: Task[] = [
  {
    label: "3D engine",
    weight: 12,
    run: async report => {
      const loaders = [
        () => import("../components/3d/Backdrops").then(m => Promise.all([
          m.loadWarp(), m.loadLiquid(), m.loadRibbon(), m.loadStream(), m.loadDots(), m.loadHorizon(),
        ])),
        () => import("../components/3d/TechGlobe"),
        () => import("../components/3d/FloatingShapes"),
        () => import("../components/3d/AboutOrbit"),
        () => import("../components/3d/HeroShapes"),
      ];
      let done = 0;
      await Promise.all(loaders.map(l => l().catch(() => null).then(() => report(++done / loaders.length))));
    },
  },
  {
    label: "Fonts",
    weight: 8,
    run: async report => {
      let done = 0;
      const all = FONTS.map(f => document.fonts.load(f).catch(() => null).then(() => report(++done / FONTS.length)));
      await withTimeout(Promise.all(all), 6000);
      await withTimeout(document.fonts.ready, 1000);
      report(1);
    },
  },
  {
    label: "Images",
    weight: 35,
    run: async report => {
      const fr = IMAGES.map(() => 0);
      const update = () => report(fr.reduce((a, b) => a + b, 0) / IMAGES.length);
      await Promise.all(IMAGES.map(async (src, i) => {
        // ảnh 5 MB → trọng số theo byte nằm ở fetch; decode ở bước sau
        await fetchBlob(src, f => { fr[i] = f * 0.9; update(); });
        try {
          const img = new Image();
          img.src = src;
          await withTimeout(img.decode(), 4000);
        } catch { /* ảnh lỗi → component tự hiện placeholder */ }
        fr[i] = 1; update();
      }));
    },
  },
  {
    label: "Soundtrack",
    weight: 45,
    run: async report => {
      const blob = await fetchBlob("/theme.mp3", report);
      if (blob) assets.music = URL.createObjectURL(blob);
    },
  },
];

/** Chạy tất cả task song song. `onProgress(0..1, nhãn task đang tải)`. */
export interface TaskDetail { label: string; frac: number }

export async function preloadAll(onProgress: (p: number, label: string, detail: TaskDetail[]) => void) {
  const fr = tasks.map(() => 0);
  const total = tasks.reduce((a, t) => a + t.weight, 0);
  const emit = () => {
    const p = tasks.reduce((a, t, i) => a + t.weight * fr[i], 0) / total;
    const pending = tasks.findIndex((_, i) => fr[i] < 1);
    onProgress(p, pending >= 0 ? tasks[pending].label : "Ready", tasks.map((t, i) => ({ label: t.label, frac: fr[i] })));
  };
  emit();
  await Promise.all(tasks.map((t, i) =>
    t.run(f => { fr[i] = Math.max(fr[i], f); emit(); })
      .catch(() => { /* một task hỏng không được chặn trang */ })
      .finally(() => { fr[i] = 1; emit(); }),
  ));
}
