import { useEffect, useState } from "react";
import type { Project } from "../../data/projects";

/**
 * Thẻ bên ngoài: luôn dùng ảnh .png. Khung chi tiết (video = true): ưu tiên video cùng tên (đuôi .mp4), ảnh .png làm poster
 * trong lúc video tải; không có video thì dùng ảnh; không có ảnh thì hiện khung thay thế.
 */
const ProjectMedia = ({ project, placeholder, video: wantVideo = false }: { project: Project; placeholder: "pj-ph" | "dm-ph"; video?: boolean }) => {
  const [videoOk, setVideoOk] = useState(true);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => { setVideoOk(true); setImgOk(true); }, [project.id]);

  const ph = <div className={placeholder}><span>{project.number}</span></div>;
  if (!project.image) return ph;

  const videoSrc = project.image.replace(/\.[^./]+$/, ".mp4");

  if (wantVideo && videoOk) {
    return (
      <video
        key={videoSrc} src={videoSrc} poster={project.image}
        autoPlay muted loop playsInline preload="auto" draggable={false}
        onError={() => setVideoOk(false)}
      />
    );
  }
  if (imgOk) {
    return <img src={project.image} alt={`${project.title} screenshot`} draggable={false} onError={() => setImgOk(false)} />;
  }
  return ph;
};

export default ProjectMedia;
