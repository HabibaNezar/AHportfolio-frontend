import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Project, ProjectCreate } from '../../../core/models/project.model';

// GET /api/Projects may return tags as a single comma-separated string.
type ProjectApiItem = Omit<Project, 'tags'> & { tags: string[] | string };
interface MediaUploadResponse { url: string; }

const API = `${environment.apiUrl}/Projects`;
const MEDIA_API = `${environment.apiUrl}/Media/upload`;

@Component({
  selector: 'app-project-manager',
  imports: [FormsModule],
  templateUrl: './project-manager.html',
  styleUrl: './project-manager.scss'
})
export class ProjectManager implements OnInit {
  projects = signal<Project[]>([]);
  loading = signal(false);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);

  showForm = signal(false);
  editingId = signal<number | null>(null);

  // Form fields. tagsInput is comma-separated text bound to the input.
  titleAr = '';
  titleEn = '';
  descAr = '';
  descEn = '';
  githubRepoUrl = '';
  liveDemoUrl = '';
  tagsInput = '';
  order = 0;
  thumbnailUrl = '';
  videoUrl = '';

  thumbnailFile: File | null = null;
  videoFile: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<ProjectApiItem[]>(API).subscribe({
      next: data => {
        this.projects.set(data.map(p => ({ ...p, tags: this.normalizeTags(p.tags) })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load projects.');
        this.loading.set(false);
      }
    });
  }

  startCreate() {
    this.resetForm();
    this.editingId.set(null);
    this.showForm.set(true);
  }

  startEdit(project: Project) {
    this.resetForm();
    this.editingId.set(project.id);
    this.titleAr = project.titleAr;
    this.titleEn = project.titleEn;
    this.descAr = project.descAr;
    this.descEn = project.descEn;
    this.githubRepoUrl = project.githubRepoUrl ?? '';
    this.liveDemoUrl = project.liveDemoUrl ?? '';
    this.tagsInput = (project.tags ?? []).join(', ');
    this.order = project.order ?? 0;
    this.thumbnailUrl = project.thumbnailUrl ?? '';
    this.videoUrl = project.videoUrl ?? '';
    this.showForm.set(true);
  }

  closeForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  onThumbnailChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.thumbnailFile = input.files?.[0] ?? null;
  }

  onVideoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.videoFile = input.files?.[0] ?? null;
  }

  save() {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    this.resolveMediaUrls().pipe(
      switchMap(urls => {
        const payload = this.buildPayload(urls.thumbnailUrl, urls.videoUrl);
        const id = this.editingId();
        return id === null
          ? this.http.post<Project>(API, payload)
          : this.http.put<Project>(`${API}/${id}`, payload);
      })
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeForm();
        this.loadProjects();
      },
      error: () => {
        this.error.set('Failed to save project. Media uploads must finish before saving.');
        this.saving.set(false);
      }
    });
  }

  deleteProject(id: number) {
    if (!confirm('Delete this project?')) return;
    this.http.delete(`${API}/${id}`).subscribe({
      next: () => this.loadProjects(),
      error: () => this.error.set('Failed to delete project.')
    });
  }

  // --- Media upload: files go to /api/Media/upload first, never inside the project payload.
  private uploadMedia(file: File, type: 'image' | 'video'): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http
      .post<MediaUploadResponse>(`${MEDIA_API}?type=${type}`, form)
      .pipe(map(res => res.url));
  }

  // Uploads pending files first so POST/PUT only fires after all uploads finish.
  private resolveMediaUrls(): Observable<{ thumbnailUrl: string; videoUrl: string }> {
    const uploads: Record<string, Observable<string>> = {};

    if (this.thumbnailFile) {
      uploads['thumbnailUrl'] = this.uploadMedia(this.thumbnailFile, 'image');
    }
    if (this.videoFile) {
      uploads['videoUrl'] = this.uploadMedia(this.videoFile, 'video');
    }

    if (Object.keys(uploads).length === 0) {
      return of({ thumbnailUrl: this.thumbnailUrl, videoUrl: this.videoUrl });
    }

    this.uploading.set(true);
    return forkJoin(uploads).pipe(
      map(result => {
        this.uploading.set(false);
        return {
          thumbnailUrl: result['thumbnailUrl'] ?? this.thumbnailUrl,
          videoUrl: result['videoUrl'] ?? this.videoUrl
        };
      })
    );
  }

  private buildPayload(thumbnailUrl: string, videoUrl: string): ProjectCreate {
    return {
      titleAr: this.titleAr,
      titleEn: this.titleEn,
      descAr: this.descAr,
      descEn: this.descEn,
      githubRepoUrl: this.githubRepoUrl || '',
      liveDemoUrl: this.liveDemoUrl || '',
      tags: this.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      order: Number(this.order) || 0,
      thumbnailUrl: thumbnailUrl || '',
      videoUrl: videoUrl || ''
    };
  }

  private normalizeTags(tags: string[] | string | unknown): string[] {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    return [];
  }

  private resetForm() {
    this.titleAr = '';
    this.titleEn = '';
    this.descAr = '';
    this.descEn = '';
    this.githubRepoUrl = '';
    this.liveDemoUrl = '';
    this.tagsInput = '';
    this.order = 0;
    this.thumbnailUrl = '';
    this.videoUrl = '';
    this.thumbnailFile = null;
    this.videoFile = null;
  }
}