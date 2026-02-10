import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Venue, VenueCreateRequest, VenueUpdateRequest } from '../../shared/models/venue.model';
import { ApiListResponse, ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  private readonly baseUrl = `${environment.apiUrl}/salles`; 

  constructor(private http: HttpClient) {}

  getAll(params?: { 
    city?: string; 
    minCapacity?: number;
    page?: number; 
    limit?: number 
  }): Observable<{ data: Venue[]; pagination: any }> {
    let httpParams = new HttpParams();
    
    if (params?.city) {
      httpParams = httpParams.set('city', params.city);
    }
    if (params?.minCapacity) {
      httpParams = httpParams.set('minCapacity', params.minCapacity.toString());
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiListResponse<Venue>>(this.baseUrl, { params: httpParams }).pipe(
      map(response => ({
        data: response.data,
        pagination: response.pagination
      }))
    );
  }

  getById(id: number): Observable<Venue> {
    return this.http.get<ApiResponse<Venue>>(`${this.baseUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  create(venue: VenueCreateRequest): Observable<Venue> {
    return this.http.post<ApiResponse<Venue>>(this.baseUrl, venue).pipe(
      map(response => response.data)
    );
  }

  update(venue: VenueUpdateRequest): Observable<Venue> {
    const { id, ...updateData } = venue;
    return this.http.put<ApiResponse<Venue>>(`${this.baseUrl}/${id}`, updateData).pipe(
      map(response => response.data)
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }

  importFromExcel(file: File): Observable<{ success: number; total: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<{ success: number; total: number; errors: string[] }>>(
      `${this.baseUrl}/import`,
      formData
    ).pipe(
      map(response => response.data)
    );
  }
}

