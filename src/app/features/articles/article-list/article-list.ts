import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Article } from '../../../core/models/article.model';
import { LanguageService } from '../../../core/services/language.service';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Footer } from '../../../shared/components/footer/footer';

@Component({
  selector: 'app-article-list',
  imports: [RouterLink, Navbar, Footer],
  templateUrl: './article-list.html',
  styleUrl: './article-list.scss'
})
export class ArticleList implements OnInit {
  articles = signal<Article[]>([]);

  constructor(
    private http: HttpClient,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.http.get<Article[]>(`${environment.apiUrl}/Articles`)
      .subscribe(data =>
        this.articles.set(
          data
            .filter(a => this.isPublished(a))
            .map(a => ({ ...a, tags: this.normalizeTags(a.tags) }))
        )
      );
  }

  private normalizeTags(tags: string | string[]): string[] {
    return typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : tags;
  }

  private isPublished(article: Article): boolean {
    const status = article.status as unknown as number | 'Draft' | 'Published';
    return typeof status === 'number' ? status === 1 : status === 'Published';
  }
}