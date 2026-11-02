import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Article, ArticleStatus } from '../../../core/models/article.model';

// GET /api/Articles may return tags as a single comma-separated string
// and status as a number (0 = Draft, 1 = Published).
type ArticleApiItem = Omit<Article, 'tags' | 'status'> & {
  tags: string[] | string;
  status: ArticleStatus | number;
};
interface MediaUploadResponse { url: string; }

const API = `${environment.apiUrl}/Articles`;
const MEDIA_API = `${environment.apiUrl}/Media/upload`;

@Component({
  selector: 'app-article-manager',
  imports: [FormsModule],
  templateUrl: './article-manager.html',
  styleUrl: './article-manager.scss'
})
export class ArticleManager implements OnInit {
  articles = signal<Article[]>([]);
  loading = signal(false);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);

  showForm = signal(false);
  editingId = signal<number | null>(null);

  // Form fields. tagsInput is comma-separated text bound to the input.
  titleAr = '';
  titleEn = '';
  contentAr = '';
  contentEn = '';
  excerptAr = '';
  excerptEn = '';
  slug = '';
  status: ArticleStatus = 'Draft';
  tagsInput = '';
  coverImageUrl = '';
  publishedAt = '';

  coverFile: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<ArticleApiItem[]>(API).subscribe({
      next: data => {
        this.articles.set(data.map(a => ({
          ...a,
          status: this.normalizeStatus(a.status),
          tags: this.normalizeTags(a.tags)
        })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load articles.');
        this.loading.set(false);
      }
    });
  }

  startCreate() {
    this.resetForm();
    this.editingId.set(null);
    this.showForm.set(true);
  }

  startEdit(article: Article) {
    this.resetForm();
    this.editingId.set(article.id);
    this.titleAr = article.titleAr;
    this.titleEn = article.titleEn;
    this.contentAr = article.contentAr;
    this.contentEn = article.contentEn;
    this.excerptAr = article.excerptAr;
    this.excerptEn = article.excerptEn;
    this.slug = article.slug;
    this.status = article.status;
    this.tagsInput = (article.tags ?? []).join(', ');
    this.coverImageUrl = article.coverImageUrl ?? '';
    this.publishedAt = article.publishedAt ?? '';
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  onCoverChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.coverFile = input.files?.[0] ?? null;
  }

  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    this.resolveCoverUrl().pipe(
      switchMap(coverImageUrl => {
        const slug = this.slug.trim() || this.slugify(this.titleEn);
        const payload = {
          titleAr: this.titleAr,
          titleEn: this.titleEn,
          contentAr: this.contentAr,
          contentEn: this.contentEn,
          excerptAr: this.excerptAr,
          excerptEn: this.excerptEn,
          slug,
          coverImageUrl: coverImageUrl || undefined,
          tags: this.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
          status: this.status,
          publishedAt: this.publishedAt || null
        };
        const id = this.editingId();
        return id === null
          ? this.http.post<Article>(API, payload)
          : this.http.put<Article>(`${API}/${id}`, payload);
      })
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadArticles();
      },
      error: () => {
        this.error.set('Failed to save article. Media uploads must finish before saving.');
        this.saving.set(false);
      }
    });
  }

  deleteArticle(id: number) {
    if (!confirm('Delete this article?')) return;
    this.http.delete(`${API}/${id}`).subscribe({
      next: () => this.loadArticles(),
      error: () => this.error.set('Failed to delete article.')
    });
  }

  // --- Media upload: the cover file goes to /api/Media/upload first,
  // never inside the article payload.
  private uploadMedia(file: File, type: 'image'): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http
      .post<MediaUploadResponse>(`${MEDIA_API}?type=${type}`, form)
      .pipe(map(res => res.url));
  }

  // Uploads the pending cover first so POST/PUT only fires after it finishes.
  private resolveCoverUrl(): Observable<string> {
    if (!this.coverFile) {
      return of(this.coverImageUrl);
    }
    this.uploading.set(true);
    return this.uploadMedia(this.coverFile, 'image').pipe(
      map(url => {
        this.uploading.set(false);
        return url;
      })
    );
  }

  private normalizeTags(tags: string[] | string | unknown): string[] {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  }

  private normalizeStatus(status: ArticleStatus | number | unknown): ArticleStatus {
    return typeof status === 'number'
      ? (status === 1 ? 'Published' : 'Draft')
      : (status as ArticleStatus);
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private resetForm() {
    this.titleAr = '';
    this.titleEn = '';
    this.contentAr = '';
    this.contentEn = '';
    this.excerptAr = '';
    this.excerptEn = '';
    this.slug = '';
    this.status = 'Draft';
    this.tagsInput = '';
    this.coverImageUrl = '';
    this.publishedAt = '';
    this.coverFile = null;
  }
}
