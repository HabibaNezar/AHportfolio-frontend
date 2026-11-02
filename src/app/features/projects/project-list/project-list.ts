import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Project } from '../../../core/models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-project-list',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss'
})
export class ProjectList implements OnInit {
  projects = signal<Project[]>([]);
  
  // المتغير الخاص بحالة الفيديو النشط
  activeVideoUrl = signal<string | null>(null);

  constructor(private http: HttpClient, public lang: LanguageService) {}

  ngOnInit() {
  this.http.get<any[]>(`${environment.apiUrl}/projects`)
    .subscribe(data => {
      // تحويل التاجز من نص واحد إلى مصفوفة (Array)
      const mappedProjects = data.map(p => ({
        ...p,
        tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : p.tags
      }));
      this.projects.set(mappedProjects);
    });
}
  // دالة فتح البوب-أب
  openVideoModal(url: string | undefined): void {
    if (url) {
      this.activeVideoUrl.set(url);
    }
  }

  // دالة قفل البوب-أب
  closeVideoModal(): void {
    this.activeVideoUrl.set(null);
  }
}