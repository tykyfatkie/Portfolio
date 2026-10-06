/** Dữ liệu kỹ năng dùng chung cho các vòng đo và quả cầu 3D. `tags` là nhãn xuất hiện trên quả cầu. */
export interface Skill { name: string; level: number; tags: string[] }
export interface SkillGroup { id: string; category: string; color: string; skills: Skill[] }

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: "frontend", category: "Front-end", color: "#39ff14",
    skills: [
      { name: "ReactJS / TypeScript",   level: 85, tags: ["ReactJS", "TypeScript"] },
      { name: "TailwindCSS",            level: 90, tags: ["TailwindCSS"] },
      { name: "Flutter (Dart)",         level: 70, tags: ["Flutter"] },
      { name: "React Native",           level: 75, tags: ["React Native"] },
      { name: "Angular",                level: 60, tags: ["Angular"] },
      { name: "Three.js / GSAP",        level: 75, tags: ["Three.js", "GSAP"] },
      { name: "Ant Design / Bootstrap", level: 80, tags: [] },
    ],
  },
  {
    id: "backend", category: "Back-end", color: "#ff2d78",
    skills: [
      { name: "NestJS (Node.js)",       level: 78, tags: ["NestJS", "Node.js"] },
      { name: "PHP",                    level: 72, tags: ["PHP"] },
      { name: "ASP.NET Core (C#)",      level: 70, tags: ["ASP.NET Core", "C#"] },
      { name: "Django (Python)",        level: 65, tags: ["Django", "Python"] },
      { name: "REST APIs",              level: 80, tags: ["REST API"] },
    ],
  },
  {
    id: "database", category: "Databases", color: "#00cfff",
    skills: [
      { name: "MariaDB / MySQL",        level: 78, tags: ["MariaDB", "MySQL"] },
      { name: "PostgreSQL",             level: 72, tags: ["PostgreSQL"] },
      { name: "SQLite",                 level: 70, tags: ["SQLite"] },
      { name: "Firebase / Supabase",    level: 72, tags: ["Firebase", "Supabase"] },
    ],
  },
  {
    id: "tools", category: "Tools & Others", color: "#ffd700",
    skills: [
      { name: "Git / GitHub / GitLab",  level: 85, tags: ["Git"] },
      { name: "Vite / npm / Yarn",      level: 80, tags: ["Vite"] },
      { name: "Docker / Redis",         level: 60, tags: ["Docker", "Redis"] },
      { name: "Axios / Zustand",        level: 75, tags: ["Zustand"] },
      { name: "Figma / Android Studio", level: 70, tags: ["Figma", "Android"] },
      { name: "YOLOv8 (AI)",            level: 60, tags: ["YOLOv8"] },
    ],
  },
];

/** Nhãn trên quả cầu: phẳng hoá từ tags, kèm nhóm để tô màu và làm nổi bật khi rê chuột. */
export const GLOBE_LABELS = SKILL_GROUPS.flatMap(g =>
  g.skills.flatMap(s => s.tags.map(text => ({ text, group: g.id, color: g.color }))),
);
