import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { FloatingNav } from './shared/components/floating-nav/floating-nav';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FloatingNav],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly showFloatingNav = signal(false);
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const url = event.urlAfterRedirects ?? event.url;
        this.showFloatingNav.set(!url.startsWith('/dashboard'));
      });
  }
}