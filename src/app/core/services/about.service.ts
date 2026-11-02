import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  About,
  Experience,
  ExperienceCreate,
  SkillCategory,
  SkillCategoryCreate,
  SkillItem,
  SkillItemCreate
} from '../models/about.model';

@Injectable({ providedIn: 'root' })
export class AboutService {
  private readonly baseUrl = `${environment.apiUrl}/About`;

  constructor(private http: HttpClient) {}

  getAbout(): Observable<About> {
    return this.http.get<About>(this.baseUrl);
  }

  updateAbout(dto: Partial<About>): Observable<void> {
    return this.http.put<void>(this.baseUrl, dto);
  }

  createSkillCategory(dto: SkillCategoryCreate): Observable<SkillCategory> {
    return this.http.post<SkillCategory>(`${this.baseUrl}/skills`, dto);
  }

  createSkillItem(categoryId: number, dto: SkillItemCreate): Observable<SkillItem> {
    return this.http.post<SkillItem>(`${this.baseUrl}/skills/${categoryId}/items`, dto);
  }

  deleteSkillCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/skills/${id}`);
  }

  deleteSkillItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/skillitems/${id}`);
  }

  createExperience(dto: ExperienceCreate): Observable<Experience> {
    return this.http.post<Experience>(`${this.baseUrl}/experiences`, dto);
  }

  deleteExperience(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/experiences/${id}`);
  }
}
