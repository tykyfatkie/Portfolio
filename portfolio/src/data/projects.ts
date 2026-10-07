/**
 * Danh sách dự án (dùng chung cho slide Projects và bảng lệnh Ctrl+K).
 * Thêm dự án mới: thêm một object vào mảng PROJECTS.
 *   image: đặt file vào public/images/projects/ (bỏ trống nếu chưa có ảnh → tự hiện khung thay thế)
 */
export interface Project {
  id: number;
  number: string;
  tag: string;
  title: string;
  description: string;
  tech: string[];
  color: string;
  teamSize: number;
  /** Thiết bị hiển thị trong khung chi tiết: laptop (mặc định) hoặc phone */
  device?: "laptop" | "phone";
  image?: string;
  githubUrl?: string;
  liveUrl?: string;
}

export const PROJECTS: Project[] = [
  {
    id: 1, number: "01", tag: "E-Commerce · Front-end Dev", title: "MomMilk Platform",
    description: "E-commerce platform for baby and mom milk products. Allows users to browse and purchase infant formula, toddler milk, and nutrition supplements for mothers.",
    tech: ["ASP.NET Core", "Node.js", "Firebase", "MySQL", "Sandbox"],
    teamSize: 4, image: "/images/projects/mommilk.png",
    githubUrl: "https://github.com/devbaoo/Mommilk", color: "#39ff14",
  },
  {
    id: 2, number: "02", tag: "Mobile · Full-stack Dev", title: "MÔME Food Order",
    description: "Food ordering app for Vinhomes District 9 residents with baby health tracking: weight, height, feeding schedules, vaccination records and growth progress.",
    tech: ["Android Studio", "SQLite", "TogetherAI API", "PayOS"],
    teamSize: 2, device: "phone", image: "/images/projects/mome.png",
    liveUrl: "https://apkpure.com/mômê/com.dk.foodorder", color: "#ff2d78",
  },
  {
    id: 3, number: "03", tag: "SaaS · Front-end + Mobile", title: "Orchid Research & Lab",
    description: "Digital platform modernising botanical research via cloud-based management and AI-driven predictive analytics. Uses YOLOv8 to monitor and forecast orchid growth patterns.",
    tech: ["ReactJS", "React Native", "Tailwind CSS", "ASP.NET Core", "YOLOv8", "PostgreSQL"],
    teamSize: 4, image: "/images/projects/orchid.png",
    githubUrl: "https://github.com/orchid-lab", color: "#00cfff",
  },
  {
    id: 4, number: "04", tag: "AI · Full-stack Dev", title: "AI Chatbox",
    description: "Intelligent chatbot web app powered by Google Gemini API. Supports multi-turn conversations with persistent chat history stored in SQLite, backed by a Django REST API and a TypeScript front-end.",
    tech: ["Django", "TypeScript", "Gemini API", "SQLite"],
    teamSize: 1, image: "/images/projects/ai-chatbox.png",
    githubUrl: "https://github.com/tykyfatkie/ai-chatbox-django", color: "#ffd700",
  },
  {
    id: 5, number: "05", tag: "HealthTech · Full-stack Dev", title: "Children Vaccination System",
    description: "End-to-end vaccination management platform for children. Handles scheduling, reminders, and payment integration via VNPay Sandbox, built on a C# .NET back-end with a TypeScript front-end.",
    tech: ["C# .NET", "TypeScript", "VNPay Sandbox", "SQL Server"],
    teamSize: 4, image: "/images/projects/cvs.png",
    githubUrl: "https://github.com/PhamVietHoangFPT/ChildrenVaccinationSystem", color: "#a855f7",
  },
  {
    id: 6, number: "06", tag: "HealthTech · Full-stack Dev", title: "Child Growth Tracking",
    description: "Comprehensive child growth monitoring platform with Google OAuth authentication. Parents record and track weight, height, and developmental milestones, with VNPay-powered premium subscriptions.",
    tech: ["C# .NET", "TypeScript", "PostgreSQL", "Google Auth", "VNPay Sandbox"],
    teamSize: 4, image: "/images/projects/cgts.png",
    githubUrl: "https://github.com/tykyfatkie/Child_Growth_Tracking_System_FE", color: "#00e5ff",
  },
];
