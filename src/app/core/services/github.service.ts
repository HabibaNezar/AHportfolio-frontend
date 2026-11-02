import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GithubRepo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
}

export interface GithubUser {
  login: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
}

@Injectable({ providedIn: 'root' })
export class GithubService {
  private readonly baseUrl = 'https://api.github.com';

  constructor(private http: HttpClient) {}

  getUser(username: string): Observable<GithubUser> {
    return this.http.get<GithubUser>(`${this.baseUrl}/users/${username}`);
  }

  getTopRepos(username: string, count = 6): Observable<GithubRepo[]> {
    return this.http.get<GithubRepo[]>(
      `${this.baseUrl}/users/${username}/repos?sort=pushed&direction=desc&per_page=${count}`
    );
  }
}
