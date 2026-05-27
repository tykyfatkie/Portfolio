export interface Project {
  id: number;
  tag: string;
  title: string;
  description: string;
  tech: string[];
  color: string;
  hue: number;
  liveUrl?: string;
  githubUrl?: string;
  role: string;
  teamSize: number;
}

export interface Stat {
  value: string;
  label: string;
  icon: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface SocialLink {
  label: string;
  abbr: string;
  url: string;
  icon: string;
}

export interface Skill {
  name: string;
  category: string;
  level: number;
}
