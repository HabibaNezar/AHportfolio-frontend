import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Profile } from '../../../core/models/profile.model';

interface MediaUploadResponse { url: string; }

const API = `${environment.apiUrl}/profile`;
const MEDIA_API = `${environment.apiUrl}/Media/upload`;

@Component({
  selector: 'app-profile-manager',
  imports: [FormsModule],
  templateUrl: './profile-manager.html',
  styleUrl: './profile-manager.scss'
})
export class ProfileManager implements OnInit {
  loading = signal(false);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  saved = signal(false);

  // Form fields bound directly (singleton resource: GET then PUT /api/profile).
  id = 0;
  nameAr = '';
  nameEn = '';
  bioAr = '';
  bioEn = '';
  avatarUrl = '';
  resumeUrl = '';
  xUrl = '';
  githubUrl = '';
  linkedInUrl = '';

  avatarFile: File | null = null;
  resumeFile: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<Profile>(API).subscribe({
      next: data => {
        this.id = data.id;
        this.nameAr = data.nameAr;
        this.nameEn = data.nameEn;
        this.bioAr = data.bioAr;
        this.bioEn = data.bioEn;
        this.avatarUrl = data.avatarUrl ?? '';
        this.resumeUrl = data.resumeUrl ?? '';
        this.xUrl = data.xUrl ?? '';
        this.githubUrl = data.githubUrl ?? '';
        this.linkedInUrl = data.linkedInUrl ?? '';
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load profile.');
        this.loading.set(false);
      }
    });
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.avatarFile = input.files?.[0] ?? null;
  }

  onResumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.resumeFile = input.files?.[0] ?? null;
  }

  saveProfile() {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.saved.set(false);

    this.resolveMediaUrls().pipe(
      switchMap(urls => {
        const payload: Profile = {
          id: this.id,
          nameAr: this.nameAr,
          nameEn: this.nameEn,
          bioAr: this.bioAr,
          bioEn: this.bioEn,
          avatarUrl: urls.avatarUrl || undefined,
          resumeUrl: urls.resumeUrl || undefined,
          xUrl: this.xUrl || undefined,
          githubUrl: this.githubUrl || undefined,
          linkedInUrl: this.linkedInUrl || undefined
        };
        return this.http.put<Profile>(API, payload);
      })
    ).subscribe({
      next: data => {
        this.avatarUrl = data.avatarUrl ?? this.avatarUrl;
        this.resumeUrl = data.resumeUrl ?? this.resumeUrl;
        this.saving.set(false);
        this.saved.set(true);
        
        // إخفاء رسالة النجاح بعد 3 ثواني
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: () => {
        this.error.set('Failed to save profile. Media uploads must finish before saving.');
        this.saving.set(false);
      }
    });
  }

  // --- Media upload: files go to /api/Media/upload first, never inside the profile payload.
  private uploadMedia(file: File, type: 'image' | 'file'): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http
      .post<MediaUploadResponse>(`${MEDIA_API}?type=${type}`, form)
      .pipe(map(res => res.url));
  }

  // Uploads pending files first so PUT only fires after all uploads finish.
  private resolveMediaUrls(): Observable<{ avatarUrl: string; resumeUrl: string }> {
    const uploads: Record<string, Observable<string>> = {};

    if (this.avatarFile) {
      uploads['avatarUrl'] = this.uploadMedia(this.avatarFile, 'image');
    }
    if (this.resumeFile) {
      uploads['resumeUrl'] = this.uploadMedia(this.resumeFile, 'file');
    }

    if (Object.keys(uploads).length === 0) {
      return of({ avatarUrl: this.avatarUrl, resumeUrl: this.resumeUrl });
    }

    this.uploading.set(true);
    return forkJoin(uploads).pipe(
      map(result => {
        this.uploading.set(false);
        return {
          avatarUrl: result['avatarUrl'] ?? this.avatarUrl,
          resumeUrl: result['resumeUrl'] ?? this.resumeUrl
        };
      })
    );
  }
}