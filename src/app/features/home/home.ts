import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Profile } from '../../core/models/profile.model';
import { LanguageService } from '../../core/services/language.service';
import { OnboardingTourService } from '../../core/services/onboarding-tour.service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';

interface Keycap {
  name: string;
  from: string;
  to: string;
  faded: boolean;
  path: string;
}

@Component({
  selector: 'app-home',
  imports: [Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  // 1. حقن الخدمات
  lang = inject(LanguageService);
  router = inject(Router);
  http = inject(HttpClient); // <-- ضيفنا حقن الـ HttpClient هنا
  private tour = inject(OnboardingTourService);
  private tourTimer?: Subscription;

  profile = signal<Profile | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);


  readonly keycaps: Keycap[] = [];

  // 2. تنفيذ جلب البيانات داخل ngOnInit
  ngOnInit(): void {
    this.http.get<Profile>(`${environment.apiUrl}/profile`).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loading.set(false); // وقفنا الـ Loading لما الداتا وصلت
        this.maybeStartOnboardingTour(data);
      },
      error: (err) => {
        console.error('Error fetching profile:', err);
        this.errorMessage.set('حدث خطأ أثناء تحميل البيانات');
        this.loading.set(false); // وقفنا الـ Loading حتى لو حصل ايرور
      }
    });
  }

  ngOnDestroy(): void {
    this.tourTimer?.unsubscribe();
    this.tour.destroy();
  }

  /**
   * First-visit onboarding tour (Driver.js).
   * Waits for the view (+ floating nav) to paint, then starts the tour
   * with the dynamic profile name. Guarded by localStorage inside the service.
   */
  private maybeStartOnboardingTour(data: Profile): void {
    if (this.tour.hasSeenTour()) {
      return;
    }
    const displayName = (data.nameEn || data.nameAr || 'My').trim();
    // Small delay so #main-nav and #tour-connect exist in the DOM.
    this.tourTimer?.unsubscribe();
    this.tourTimer = timer(600).subscribe(() => this.tour.startTour(displayName));
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }
}