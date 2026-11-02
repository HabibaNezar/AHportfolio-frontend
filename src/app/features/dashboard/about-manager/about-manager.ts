import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { About } from '../../../core/models/about.model';
import { AboutService } from '../../../core/services/about.service';
import { DatePipe } from '@angular/common'; // ضيفي السطر ده

@Component({
  selector: 'app-about-manager',
  imports: [FormsModule, DatePipe], // ضيفي DatePipe هنا
  templateUrl: './about-manager.html',
  styleUrl: './about-manager.scss'
})
export class AboutManager implements OnInit {
  about = signal<About | null>(null);
  loading = signal(false);
  savingAbout = signal(false);
  error = signal<string | null>(null);
  saved = signal(false);

  // About text (PUT /api/About).
  aboutText = '';

  // Skill category form (POST /api/About/skills).
  categoryName = '';
  savingCategory = signal(false);

  // Skill item form (POST /api/About/skills/{categoryId}/items).
  itemCategoryId: number | null = null;
  itemName = '';
  itemIcon = '';
  savingItem = signal(false);

  // Experience form (POST /api/About/experiences).
  expFrom = '';
  expTo = '';
  expDescription = '';
  savingExperience = signal(false);

  constructor(private aboutService: AboutService) {}

  ngOnInit() {
    this.loadAbout();
  }

  loadAbout() {
    this.loading.set(true);
    this.error.set(null);
    this.aboutService.getAbout().subscribe({
      next: data => {
        this.about.set(data);
        this.aboutText = data.about ?? '';
        if (this.itemCategoryId === null && data.skillCategories.length) {
          this.itemCategoryId = data.skillCategories[0].id;
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load about data.');
        this.loading.set(false);
      }
    });
  }

  saveAboutText() {
    if (this.savingAbout()) return;
    this.savingAbout.set(true);
    this.error.set(null);
    this.saved.set(false);
    this.aboutService.updateAbout({ about: this.aboutText }).subscribe({
      next: () => {
        this.savingAbout.set(false);
        this.saved.set(true);
        this.loadAbout();
        setTimeout(() => this.saved.set(false), 3000); // إخفاء رسالة النجاح بعد 3 ثواني
      },
      error: () => {
        this.error.set('Failed to save about text.');
        this.savingAbout.set(false);
      }
    });
  }

  addCategory() {
    const name = this.categoryName.trim();
    if (!name || this.savingCategory()) return;
    this.savingCategory.set(true);
    this.aboutService.createSkillCategory({ name }).subscribe({
      next: () => {
        this.categoryName = '';
        this.savingCategory.set(false);
        this.loadAbout();
      },
      error: () => {
        this.error.set('Failed to add skill category.');
        this.savingCategory.set(false);
      }
    });
  }

  deleteCategory(id: number) {
    if (!confirm('Delete this skill category and its items?')) return;
    this.aboutService.deleteSkillCategory(id).subscribe({
      next: () => this.loadAbout(),
      error: () => this.error.set('Failed to delete skill category.')
    });
  }

  addItem() {
    const name = this.itemName.trim();
    if (!name || this.itemCategoryId === null || this.savingItem()) return;
    this.savingItem.set(true);
    this.aboutService.createSkillItem(this.itemCategoryId, {
      name,
      icon: this.itemIcon.trim() || undefined
    }).subscribe({
      next: () => {
        this.itemName = '';
        this.itemIcon = '';
        this.savingItem.set(false);
        this.loadAbout();
      },
      error: () => {
        this.error.set('Failed to add skill item.');
        this.savingItem.set(false);
      }
    });
  }

  deleteItem(id: number) {
    if (!confirm('Delete this skill?')) return;
    this.aboutService.deleteSkillItem(id).subscribe({
      next: () => this.loadAbout(),
      error: () => this.error.set('Failed to delete skill item.')
    });
  }

  addExperience() {
    const description = this.expDescription.trim();
    if (!description || this.savingExperience()) return;
    this.savingExperience.set(true);
    this.aboutService.createExperience({
      from: this.expFrom || undefined,
      to: this.expTo || undefined,
      description
    }).subscribe({
      next: () => {
        this.expFrom = '';
        this.expTo = '';
        this.expDescription = '';
        this.savingExperience.set(false);
        this.loadAbout();
      },
      error: () => {
        this.error.set('Failed to add experience.');
        this.savingExperience.set(false);
      }
    });
  }

  deleteExperience(id: number) {
    if (!confirm('Delete this experience?')) return;
    this.aboutService.deleteExperience(id).subscribe({
      next: () => this.loadAbout(),
      error: () => this.error.set('Failed to delete experience.')
    });
  }
}