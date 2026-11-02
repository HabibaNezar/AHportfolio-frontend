import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Profile } from '../../core/models/profile.model';
import { LanguageService } from '../../core/services/language.service';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';

@Component({
  selector: 'app-contact',
  imports: [FormsModule, Navbar, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class Contact implements OnInit {
  profile = signal<Profile | null>(null);

  /** TODO: expose from Profile model / backend instead of hardcoding. */
  readonly contactEmail = 'hello@example.com';

  contactName = '';
  contactEmailInput = '';
  contactMessage = '';
  contactSent = signal(false);

  constructor(
    private http: HttpClient,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.http.get<Profile>(`${environment.apiUrl}/profile`)
      .subscribe({
        next: data => this.profile.set(data),
        error: () => this.profile.set(null)
      });
  }

  onContactSubmit() {
    // TODO: wire this up to a backend endpoint (e.g. POST /contact) when ready.
    // For now we only render a confirmation placeholder.
    this.contactSent.set(true);
  }
}