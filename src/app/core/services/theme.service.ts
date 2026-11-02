import { Injectable, signal, effect, computed } from '@angular/core';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'portfolio_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /**
   * Dark is the default on first load. The choice is backed by an in-memory
   * signal and persisted to localStorage when available (try/catch guard keeps
   * this safe inside sandboxed previews where storage access is blocked).
   */
  theme = signal<Theme>(this.initialTheme());
  isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle('light', this.theme() === 'light');
      // Keep a data-theme attribute for extra CSS hooks / browser extensions.
      document.body.setAttribute('data-theme', this.theme());
      try {
        localStorage.setItem(STORAGE_KEY, this.theme());
      } catch {
        /* storage unavailable — the in-memory signal still drives the UI */
      }
    });
  }

  toggle() {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private initialTheme(): Theme {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  }
}