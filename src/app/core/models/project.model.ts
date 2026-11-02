export interface Project {
  id: number;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  githubRepoUrl?: string;
  liveDemoUrl?: string;
  tags: string[];
  order: number;
}

export type ProjectCreate = Omit<Project, 'id'>;
