export interface SkillItem {
  id: number;
  name: string;
  icon?: string;
  skillCategoryId: number;
  skillCategory?: string;
}

export interface SkillCategory {
  id: number;
  name: string;
  about?: string;
  aboutId: number;
  items: SkillItem[];
}

export interface Experience {
  id: number;
  from?: string | null;
  to?: string | null;
  about?: string;
  description?: string;
  aboutId: number;
}

export interface About {
  id: number;
  about?: string;
  skillCategories: SkillCategory[];
  experiences: Experience[];
}

export type SkillCategoryCreate = Pick<SkillCategory, 'name' | 'about'>;

export type SkillItemCreate = Pick<SkillItem, 'name' | 'icon'>;

export type ExperienceCreate = Pick<Experience, 'from' | 'to' | 'about' | 'description'>;
