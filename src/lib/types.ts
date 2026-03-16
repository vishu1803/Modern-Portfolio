// Global Types for the Resume Portfolio Story

export type SectionType = "hero" | "scanning" | "selected" | "skills" | "projects" | "experience" | "contact";

export interface ResumeData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
}

export interface SkillItem {
  id: string;
  name: string;
  level: number; // 0-100
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  link?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}
