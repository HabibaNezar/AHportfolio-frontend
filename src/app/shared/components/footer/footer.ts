import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  private router = inject(Router);
  year = new Date().getFullYear();

  private readonly paths: Record<string, string> = {
    home: '/',
    about: '/about',
    projects: '/projects',
    contact: '/contact'
  };

  constructor(public lang: LanguageService) {}

  goTo(section: string) {
    this.router.navigate([this.paths[section] ?? '/']);
  }
}