import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardStats, RecentActivity } from '../../shared/models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.baseUrl}/stats`).pipe(
      map(response => response.data)
    );
  }

  getRecentActivity(): Observable<RecentActivity[]> {
    return this.http.get<{ success: boolean; data: RecentActivity[] }>(`${this.baseUrl}/recent-activity`).pipe(
      map(response => response.data)
    );
  }
}

