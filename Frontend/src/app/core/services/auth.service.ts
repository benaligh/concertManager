import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError, delay } from 'rxjs/operators';
import { User } from '../../shared/models/user.model';
import { LoginRequest, LoginResponse } from '../../shared/models/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    
    if (environment.useMockAuth) {
      return this.mockLogin(credentials);
    }

    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setUser(response.user);
        this.currentUserSubject.next(response.user);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  private mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
    
    if (!credentials.email || !credentials.email.includes('@')) {
      return throwError(() => ({
        status: 400,
        error: { message: 'Email invalide. L\'email doit contenir @' }
      }));
    }

    if (!credentials.password || credentials.password.length < 6) {
      return throwError(() => ({
        status: 400,
        error: { message: 'Mot de passe invalide. Le mot de passe doit contenir au moins 6 caractères' }
      }));
    }

    return of({
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 1,
        email: credentials.email,
        name: credentials.email.split('@')[0], 
        role: 'admin'
      }
    } as LoginResponse).pipe(
      delay(500), 
      tap(response => {
        this.setToken(response.token);
        this.setUser(response.user);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }
}

