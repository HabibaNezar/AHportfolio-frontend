import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Article } from '../../../core/models/article.model';
import { LanguageService } from '../../../core/services/language.service';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-article-detail',
  imports: [Navbar, Footer],
  templateUrl: './article-detail.html',
  styleUrl: './article-detail.scss'
})
export class ArticleDetail implements OnInit {
  article = signal<Article | null>(null);
  paragraphs = signal<string[]>([]);

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      return;
    }

    this.http.get<Article>(`${environment.apiUrl}/Articles/${slug}`)
      .subscribe(data => {
        const content = this.lang.pick(data.contentAr, data.contentEn);
        this.paragraphs.set(
          content.split('\n').map(p => p.trim()).filter(Boolean)
        );
        this.article.set({ ...data, tags: this.normalizeTags(data.tags) });
      });
  }

  private normalizeTags(tags: string | string[]): string[] {
    return typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : tags;
  }
}