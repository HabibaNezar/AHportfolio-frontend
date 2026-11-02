export type ArticleStatus = 'Draft' | 'Published';

export interface Article {
  id: number;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  excerptAr: string;
  excerptEn: string;
  slug: string;
  coverImageUrl?: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: string | null;
}
