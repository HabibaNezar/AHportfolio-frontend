import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Navbar],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';
  errorMessage = signal<string | null>(null);

  constructor(private auth: AuthService, private router: Router, public lang: LanguageService) {}

  onSubmit() {
    this.errorMessage.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: (res) => {
        this.auth.storeToken(res.token);
        this.router.navigate(['/dashboard/projects']);
      },
      error: () => this.errorMessage.set(this.lang.t('login.error'))
    });
  }
}
