import { Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';

type Lang = 'ar' | 'en';
const STORAGE_KEY = 'portfolio_lang';
interface TranslationMap {
  [key: string]: string | TranslationMap;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  lang = signal((localStorage.getItem(STORAGE_KEY) as Lang) || 'en');
  private translations = signal<TranslationMap>({});

  constructor(private http: HttpClient) {
    effect(() => {
      const current = this.lang();
      document.documentElement.setAttribute('lang', current);
      document.documentElement.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
      localStorage.setItem(STORAGE_KEY, current);
      this.loadTranslations(current);
    });
  }

  private loadTranslations(lang: Lang) {
    this.http
      .get<TranslationMap>(`assets/i18n/${lang}.json`)
      .subscribe(data => this.translations.set(data));
  }

  toggle() {
    this.lang.set(this.lang() === 'en' ? 'ar' : 'en');
  }

  /** Pick the right field out of a bilingual API pair, e.g. pick(project.titleAr, project.titleEn) */
  pick<T>(arValue: T, enValue: T): T {
    return this.lang() === 'ar' ? arValue : enValue;
  }

  /** Read static UI text by dotted key, e.g. t('nav.projects') */
  t(key: string): string {
    const value = key
      .split('.')
      .reduce<string | TranslationMap | undefined>(
        (obj: string | TranslationMap | undefined, segment: string) =>
          obj && typeof obj === 'object' && segment in obj ? obj[segment] : undefined,
        this.translations()
      );

    return typeof value === 'string' ? value : key;
  }
}
