import { useEffect, useState } from "react";
import type { Project } from "../../data/projects";

/** Ưu tiên video cùng tên (đuôi .mp4); không có video thì dùng ảnh .png; không có ảnh thì hiện khung thay thế. */
const ProjectMedia = ({ project, placeholder }: { project: Project; placeholder: "pj-ph" | "dm-ph" }) => {
  const [videoOk, setVideoOk] = useState(true);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => { setVideoOk(true); setImgOk(true); }, [project.id]);

  const ph = <div className={placeholder}><span>{project.number}</span></div>;
  if (!project.image) return ph;

  const video = project.image.replace(/\.[^./]+$/, ".mp4");

  if (videoOk) {
    return (
      <video
        key={video} src={video}
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
