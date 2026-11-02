import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Project } from '../../../core/models/project.model';
import { LanguageService } from '../../../core/services/language.service';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-project-detail',
  imports: [Navbar, Footer],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss'
})
export class ProjectDetail implements OnInit {
  project = signal<Project | null>(null);

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.http.get<Project>(`${environment.apiUrl}/projects/${id}`)
      .subscribe(data => this.project.set(data));
  }
}
