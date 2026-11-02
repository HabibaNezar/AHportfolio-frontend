import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';

interface Section {
  id: string;
  path: string;
  labelKey: string;
}

@Component({
  selector: 'app-floating-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './floating-nav.html',
  styleUrl: './floating-nav.scss'
})
export class FloatingNav {
  readonly sections: Section[] = [
    { id: 'home', path: '/', labelKey: 'nav.home' },
    { id: 'about', path: '/about', labelKey: 'nav.about' },
    { id: 'projects', path: '/projects', labelKey: 'nav.projects' },
    { id: 'articles', path: '/articles', labelKey: 'nav.articles' },
    { id: 'contact', path: '/contact', labelKey: 'nav.contact' }
  ];

  isHovering = signal<boolean>(false);

  constructor(public lang: LanguageService) {}

  onMouseEnter() {
    this.isHovering.set(true);
  }

  onMouseMove(event: MouseEvent) {
    const navContainer = event.currentTarget as HTMLElement;
    const items = Array.from(navContainer.querySelectorAll('.floating-item')) as HTMLElement[];

    // قللنا المسافة شوية عشان التأثير يكون مركز أكتر وميتداخلش بشكل مزعج
    const maxDistance = 120; 

    // 1. تحديد الأيقونة الأقرب للماوس حصرياً
    let minDistance = Infinity;
    let closestIndex = -1;
    const distances = items.map((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const dist = Math.abs(event.clientX - itemCenter);
      
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
      return dist;
    });

    // 2. تطبيق الأحجام والـ Tooltip
    items.forEach((item, index) => {
      const distance = distances[index];

      if (distance > maxDistance) {
        this.resetItemStyles(item);
        return;
      }

      const factor = Math.max(0, 1 - distance / maxDistance);
      
      // استخدام أُس 2 بيخلي القمة حادة، فالأيقونة الأقرب بتبان بوضوح واللي جنبها أصغر
      const smoothFactor = Math.pow(factor, 2);

      const currentSize = 44 + (26 * smoothFactor); 
      const iconScale = 1 + (0.5 * smoothFactor); 
      const zIndex = Math.round(10 * smoothFactor);

      item.style.setProperty('--dynamic-size', `${currentSize}px`);
      item.style.setProperty('--dynamic-icon-scale', `${iconScale}`);
      item.style.setProperty('--dynamic-z-index', `${zIndex}`);
      item.style.setProperty('--bg-mix-percent', `${smoothFactor * 100}%`);

      // إظهار الـ Tooltip للأيقونة الأقرب فقط، وبشرط إن الماوس يكون قريب منها فعلاً
      if (index === closestIndex && smoothFactor > 0.4) {
        item.style.setProperty('--tooltip-opacity', '1');
        item.style.setProperty('--tooltip-y', '0px');
      } else {
        item.style.setProperty('--tooltip-opacity', '0');
        item.style.setProperty('--tooltip-y', '8px');
      }
    });
  }

  onMouseLeave(event: MouseEvent) {
    this.isHovering.set(false);
    const navContainer = event.currentTarget as HTMLElement;
    const items = Array.from(navContainer.querySelectorAll('.floating-item')) as HTMLElement[];

    items.forEach(item => this.resetItemStyles(item));
  }

  private resetItemStyles(item: HTMLElement) {
    item.style.removeProperty('--dynamic-size');
    item.style.removeProperty('--dynamic-icon-scale');
    item.style.removeProperty('--dynamic-z-index');
    item.style.removeProperty('--bg-mix-percent');
    item.style.removeProperty('--tooltip-opacity');
    item.style.removeProperty('--tooltip-y');
  }
}