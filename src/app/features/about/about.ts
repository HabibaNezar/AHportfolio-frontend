import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  computed,
  effect,
  ElementRef,
  signal,
  viewChild
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Profile } from '../../core/models/profile.model';
import { About as AboutData, SkillCategory, SkillItem } from '../../core/models/about.model';
import { AboutService } from '../../core/services/about.service';
import { LanguageService } from '../../core/services/language.service';
import { Navbar } from '../../shared/components/navbar/navbar';

const OTHERS_KEY = -1;

@Component({
  selector: 'app-about',
  imports: [Navbar],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About implements OnInit, AfterViewInit, OnDestroy {
  protected readonly OTHERS = OTHERS_KEY;

  about = signal<AboutData | null>(null);
  profile = signal<Profile | null>(null);

  readonly avatarUrl = computed<string | null>(() => {
    const url = this.profile()?.avatarUrl;
    if (!url) return null;
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  });

  activeSkillCategoryId = signal<number | null>(null);
  visibleCategoryIds = signal<number[]>([]);

  readonly tabsContainer = viewChild<ElementRef<HTMLElement>>('tabsContainer');
  private resizeObserver?: ResizeObserver;

  // --- Tooltip الأيقونات (مثبت على الشاشة علشان ميتقصش من الـ overflow) ---
  readonly tooltipVisible = signal(false);
  readonly tooltipText = signal('');
  readonly tooltipLeft = signal(0);
  readonly tooltipTop = signal(0);
  private readonly tooltipEl = viewChild<ElementRef<HTMLElement>>('skillTooltip');

  readonly allCategories = computed(() => this.about()?.skillCategories ?? []);

  readonly visibleCategories = computed(() => {
    const byId = new Map<number, SkillCategory>(this.allCategories().map(c => [c.id, c]));
    return this.visibleCategoryIds()
      .map(id => byId.get(id))
      .filter((c): c is SkillCategory => !!c);
  });

  readonly othersCategories = computed(() => {
    const visible = new Set(this.visibleCategoryIds());
    return this.allCategories().filter(c => !visible.has(c.id));
  });

  // السر هنا: لو داس على Others بنجمع كل الـ Items بتاعت الأقسام الزيادة في مكان واحد
  readonly activeItems = computed<SkillItem[]>(() => {
    const active = this.activeSkillCategoryId();
    if (active === OTHERS_KEY) {
      return this.othersCategories().flatMap(c => c.items);
    }
    return this.allCategories().find(c => c.id === active)?.items ?? [];
  });

  constructor(
    public lang: LanguageService,
    private http: HttpClient,
    private aboutService: AboutService,
    private host: ElementRef<HTMLElement>
  ) {
    effect(() => {
      const el = this.tabsContainer()?.nativeElement;
      if (el && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.refitTabs());
        this.resizeObserver.observe(el);
        setTimeout(() => this.refitTabs(), 50);
      }
    });
  }

  ngOnInit() {
    this.http.get<Profile>(`${environment.apiUrl}/profile`)
      .subscribe({
        next: data => this.profile.set(data),
        error: () => this.profile.set(null)
      });

    this.aboutService.getAbout().subscribe({
      next: data => {
        this.about.set(data);
        if (data?.skillCategories?.length) {
          this.activeSkillCategoryId.set(data.skillCategories[0].id);
          this.visibleCategoryIds.set(data.skillCategories.map(c => c.id));
        }
      },
      error: () => this.about.set(null)
    });
  }

  ngAfterViewInit() {
    document.fonts?.ready?.then(() => setTimeout(() => this.refitTabs(), 50));
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  // --- Tooltip الأيقونات ---
  tooltipShow(event: MouseEvent, name: string): void {
    this.tooltipText.set(name);
    this.tooltipVisible.set(true);
    this.tooltipMove(event);
  }

  tooltipMove(event: MouseEvent): void {
    if (!this.tooltipVisible()) return;
    const card = this.host.nativeElement.querySelector('.bento-skills')?.getBoundingClientRect();
    const tip = this.tooltipEl()?.nativeElement;
    if (!card || !tip) return;

    const gap = 14;
    let x = event.clientX + gap;
    let y = event.clientY + gap;
    // منطلعش الـ Tooltip بره حدود الكارت خالص
    x = Math.min(Math.max(x, card.left + 8), card.right - tip.offsetWidth - 8);
    y = Math.min(Math.max(y, card.top + 8), card.bottom - tip.offsetHeight - 8);
    this.tooltipLeft.set(x);
    this.tooltipTop.set(y);
  }

  tooltipHide(): void {
    this.tooltipVisible.set(false);
  }

  private refitTabs() {
    const container = this.tabsContainer()?.nativeElement;
    const categories = this.allCategories();
    if (!container || !categories.length) return;

    this.visibleCategoryIds.set(categories.map(c => c.id));

    const step = () => {
      const visible = this.visibleCategoryIds();
      if (visible.length <= 1) return;

      let totalWidth = 0;
      const gap = parseFloat(getComputedStyle(container).gap) || 8;
      const tabs = Array.from(container.children) as HTMLElement[];
      
      tabs.forEach(tab => {
        totalWidth += tab.getBoundingClientRect().width + gap;
      });
      totalWidth -= gap;

      if (totalWidth > container.clientWidth) {
        const folded = visible.slice(0, -1);
        this.visibleCategoryIds.set(folded);

        const active = this.activeSkillCategoryId();
        if (active !== null && active !== OTHERS_KEY && !folded.includes(active)) {
          this.activeSkillCategoryId.set(OTHERS_KEY);
        }
        
        setTimeout(step, 0);
      }
    };

    setTimeout(step, 0);
  }

  formatDates(from?: string | null, to?: string | null): string {
    const format = (date?: string | null) =>
      date
        ? new Date(date).toLocaleDateString(this.lang.lang() === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric'
          })
        : '';
    const fromStr = format(from);
    const toStr = format(to);
    if (!fromStr && !toStr) return '';
    return fromStr ? `${fromStr} — ${toStr || this.lang.t('about.present')}` : toStr;
  }
}