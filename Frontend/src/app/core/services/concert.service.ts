import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Concert, ConcertCreateRequest, ConcertUpdateRequest, ConcertUpdateDisplayRequest, ConcertDisplay, ConcertStatus } from '../../shared/models/concert.model';
import { ApiListResponse, ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConcertService {
  private readonly baseUrl = `${environment.apiUrl}/concerts`;

  constructor(private http: HttpClient) {}

  getAll(params?: { 
    status?: ConcertStatus; 
    date?: string; 
    salleId?: number;
    groupId?: number;
    page?: number; 
    limit?: number 
  }): Observable<{ data: ConcertDisplay[]; pagination: any }> {
    let httpParams = new HttpParams();
    
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.date) {
      httpParams = httpParams.set('date', params.date);
    }
    if (params?.salleId) {
      httpParams = httpParams.set('salleId', params.salleId.toString());
    }
    if (params?.groupId) {
      httpParams = httpParams.set('groupId', params.groupId.toString());
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiListResponse<Concert>>(this.baseUrl, { params: httpParams }).pipe(
      map(response => ({
        data: response.data.map(c => this.mapConcertToDisplay(c)),
        pagination: response.pagination
      }))
    );
  }

  getById(id: number): Observable<ConcertDisplay> {
    return this.http.get<ApiResponse<Concert>>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.mapConcertToDisplay(response.data))
    );
  }

  create(concert: ConcertCreateRequest): Observable<ConcertDisplay> {
    const payload = {
      groupId: Number(concert.groupId),
      salleId: Number(concert.salleId),
      date: String(concert.date),
      time: String(concert.time),
      duration: Number(concert.duration),
      status: String(concert.status)
    };
    
    return this.http.post<ApiResponse<Concert>>(this.baseUrl, payload).pipe(
      map(response => {
        if (!response) {
          throw new Error('Réponse vide du serveur');
        }
        
        if (!response.success) {
          throw new Error(response.message || 'Erreur lors de la création du concert');
        }
        
        if (!response.data) {
          throw new Error('Données manquantes dans la réponse');
        }
        
        return this.mapConcertToDisplay(response.data);
      })
    );
  }

  update(concert: ConcertUpdateRequest | ConcertUpdateDisplayRequest): Observable<ConcertDisplay> {
    const { id, ...updateData } = concert;

    const backendData: any = {};

    if ('venueId' in updateData && updateData.venueId !== undefined) {
      backendData.salleId = updateData.venueId;
    } else if ('salleId' in updateData && updateData.salleId !== undefined) {
      backendData.salleId = updateData.salleId;
    }
    
    if ('duration' in updateData && updateData.duration !== undefined) {
      if ('venueId' in updateData || 'venueName' in updateData) {
        backendData.duration = Math.round(updateData.duration / 60);
      } else {
        backendData.duration = updateData.duration;
      }
    }

    Object.keys(updateData).forEach(key => {
      if (key !== 'venueId' && key !== 'duration' && key !== 'venueName' && 
          key !== 'groupId' && key !== 'groupName' && key !== 'salleId') {
        backendData[key] = (updateData as any)[key];
      }
    });

    if ('groupId' in updateData && updateData.groupId !== undefined) {
      backendData.groupId = updateData.groupId;
    }

    return this.http.put<ApiResponse<Concert>>(`${this.baseUrl}/${id}`, backendData).pipe(
      map(response => this.mapConcertToDisplay(response.data))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`).pipe(
      map(() => void 0)
    );
  }

  private mapConcertToDisplay(concert: Concert): ConcertDisplay {
    let time = '';
    if (typeof concert.time === 'string') {
      if (concert.time.includes('T')) {
        const timeStr = concert.time.split('T')[1]?.split('.')[0] || concert.time;
        const timeParts = timeStr.split(':');
        time = `${timeParts[0]}:${timeParts[1]}`;
      } else {
        const timeParts = concert.time.split(':');
        time = `${timeParts[0]}:${timeParts[1]}`;
      }
    } else {
      time = '00:00';
    }

    const result: ConcertDisplay = {
      id: concert.id,
      groupId: concert.group?.id || 0,
      groupName: concert.group?.name,
      venueId: concert.salle?.id || 0,
      venueName: concert.salle?.name,
      date: concert.date,
      time: time,
      duration: (concert.duration || 1) * 60, 
      status: concert.status,
      createdAt: concert.createdAt,
      updatedAt: concert.updatedAt
    };
    
    return result;
  }
}

