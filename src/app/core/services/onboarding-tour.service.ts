import { Injectable } from '@angular/core';
import { driver, type Driver, type DriveStep } from 'driver.js';

@Injectable({ providedIn: 'root' })
export class OnboardingTourService {
  private readonly storageKey = 'portfolio-onboarding-seen-v1';
  private driverInstance: Driver | null = null;

  /** localStorage guard — tour only runs once for first-time visitors. */
  hasSeenTour(): boolean {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem(this.storageKey) === 'true';
    } catch {
      return false;
    }
  }

  markTourAsSeen(): void {
    try {
      localStorage?.setItem(this.storageKey, 'true');
    } catch {
      /* storage unavailable (private mode) — ignore */
    }
  }

  /** Call this after GET /api/Profile resolves so the name is dynamic. */
  startTour(profileName: string): Driver | null {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return null;
    }
    if (this.hasSeenTour() || this.driverInstance?.isActive()) {
      return null;
    }

    const name = (profileName ?? '').trim() || 'My';

    const steps: DriveStep[] = [
      // Step 1 — center screen, no element
      {
        popover: {
          title: `Welcome to ${name}'s World! `,
          description:
            "I'm so glad you're here! Let's take a quick tour to help you easily navigate through my work and experience.",
        },
      },
      // Step 2 — bottom navigation bar
      {
        element: '#main-nav',
        popover: {
          title: 'Your Control Center ',
          description:
            'Use this quick navigation bar to seamlessly jump between my Projects, About section, and more.',
          side: 'top',
          align: 'center',
        },
      },
      // Step 3 — primary action (Resume / Contact)
      {
        element: '#tour-connect',
        popover: {
          title: "Let's Connect! ",
          description:
            'Feel free to check out my resume or reach out directly. Enjoy exploring the portfolio!',
          side: 'bottom',
          align: 'start',
        },
      },
    ];

    this.driverInstance = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: true,
      showProgress: true,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'portfolio-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done 🎉',
      // Mark as seen whether completed, skipped, or closed — runs once.
      onDestroyed: () => this.markTourAsSeen(),
      onCloseClick: (_el, _step, opts) => {
        opts.driver.destroy();
      },
      steps,
    });

    // Give Angular a tick to paint .hero-cta / #main-nav before highlighting.
    requestAnimationFrame(() => {
      // Fallbacks if an anchor is missing on some viewport/route.
      const resolved = this.resolveSteps(steps);
      this.driverInstance?.setSteps(resolved);
      this.driverInstance?.drive();
    });

    return this.driverInstance;
  }

  destroy(): void {
    this.driverInstance?.destroy();
    this.driverInstance = null;
  }

  /** Swap to class fallbacks so missing ids don't break the tour. */
  private resolveSteps(steps: DriveStep[]): DriveStep[] {
    return steps.map(step => {
      if (typeof step.element !== 'string') {
        return step;
      }
      if (document.querySelector(step.element)) {
        return step;
      }
      const fallback =
        step.element === '#main-nav'
          ? '.floating-nav'
          : step.element === '#tour-connect'
            ? '.hero-cta .btn-resume, .hero-cta .btn-hire, .hero-cta'
            : null;
      if (fallback && document.querySelector(fallback)) {
        return { ...step, element: fallback };
      }
      // No target in DOM → render as centered popover step.
      const { element: _dropped, ...rest } = step;
      return rest;
    });
  }
}
