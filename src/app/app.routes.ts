import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then(m => m.Home)
  },
  {
    path: 'about',
    loadComponent: () => import('./features/about/about').then(m => m.About)
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then(m => m.Contact)
  },
  {
    path: 'projects',
    loadComponent: () => import('./features/projects/project-list/project-list').then(m => m.ProjectList)
  },
  {
    path: 'projects/:id',
    loadComponent: () => import('./features/projects/project-detail/project-detail').then(m => m.ProjectDetail)
  },
  {
    path: 'articles',
    loadComponent: () => import('./features/articles/article-list/article-list').then(m => m.ArticleList)
  },
  {
    path: 'articles/:slug',
    loadComponent: () => import('./features/articles/article-detail/article-detail').then(m => m.ArticleDetail)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/dashboard/login/login').then(m => m.Login)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/main-dashboard/main-dashboard').then(m => m.MainDashboard),
    children: [
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
      {
        path: 'projects',
        loadComponent: () => import('./features/dashboard/project-manager/project-manager').then(m => m.ProjectManager)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/dashboard/profile-manager/profile-manager').then(m => m.ProfileManager)
      },
      {
        path: 'articles',
        loadComponent: () => import('./features/dashboard/article-manager/article-manager').then(m => m.ArticleManager)
      },
      {
        path: 'about',
        loadComponent: () => import('./features/dashboard/about-manager/about-manager').then(m => m.AboutManager)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
