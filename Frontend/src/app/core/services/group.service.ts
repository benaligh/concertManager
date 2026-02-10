import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Group, GroupCreateRequest, GroupUpdateRequest, GroupUpdateDisplayRequest, GroupDisplay } from '../../shared/models/group.model';
import { ApiListResponse, ApiResponse } from '../../shared/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private readonly baseUrl = `${environment.apiUrl}/groups`;

  constructor(private http: HttpClient) {}

  getAll(params?: { 
    name?: string; 
    city?: string; 
    musicalStyle?: string; 
    startYear?: number;
    page?: number; 
    limit?: number 
  }): Observable<{ data: GroupDisplay[]; pagination: any }> {
    let httpParams = new HttpParams();
    
    if (params?.name) {
      httpParams = httpParams.set('name', params.name);
    }
    if (params?.city) {
      httpParams = httpParams.set('city', params.city);
    }
    if (params?.musicalStyle) {
      httpParams = httpParams.set('musicalStyle', params.musicalStyle);
    }
    if (params?.startYear) {
      httpParams = httpParams.set('startYear', params.startYear.toString());
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApiListResponse<Group>>(this.baseUrl, { params: httpParams }).pipe(
      map(response => ({
        data: response.data.map(g => this.mapGroupToDisplay(g)),
        pagination: response.pagination
      }))
    );
  }

  getById(id: number): Observable<GroupDisplay> {
    return this.http.get<ApiResponse<Group>>(`${this.baseUrl}/${id}`).pipe(
      map(response => this.mapGroupToDisplay(response.data))
    );
  }

  create(group: GroupCreateRequest): Observable<GroupDisplay> {
    return this.http.post<ApiResponse<Group>>(this.baseUrl, group).pipe(
      map(response => this.mapGroupToDisplay(response.data))
    );
  }

  update(group: GroupUpdateRequest | GroupUpdateDisplayRequest): Observable<GroupDisplay> {
    const { id, ...updateData } = group;
    
    const backendData: any = {};

    if ('musicalCurrent' in updateData && updateData.musicalCurrent !== undefined) {
      backendData.musicalStyle = updateData.musicalCurrent;
    } else if ('musicalStyle' in updateData && updateData.musicalStyle !== undefined) {
      backendData.musicalStyle = updateData.musicalStyle;
    }
    
    if ('members' in updateData && updateData.members !== undefined) {
      backendData.membersCount = updateData.members;
    } else if ('membersCount' in updateData && updateData.membersCount !== undefined) {
      backendData.membersCount = updateData.membersCount;
    }
    
    if ('separationYear' in updateData && updateData.separationYear !== undefined) {
      backendData.endYear = updateData.separationYear;
    } else if ('endYear' in updateData && updateData.endYear !== undefined) {
      backendData.endYear = updateData.endYear;
    }

    Object.keys(updateData).forEach(key => {
      if (key !== 'musicalCurrent' && key !== 'members' && key !== 'separationYear' && 
          key !== 'musicalStyle' && key !== 'membersCount' && key !== 'endYear') {
        backendData[key] = (updateData as any)[key];
      }
    });

    return this.http.put<ApiResponse<Group>>(`${this.baseUrl}/${id}`, backendData).pipe(
      map(response => this.mapGroupToDisplay(response.data))
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

  private mapGroupToDisplay(group: Group): GroupDisplay {
    return {
      id: group.id,
      name: group.name,
      origin: group.origin,
      city: group.city,
      startYear: group.startYear,
      separationYear: group.endYear, 
      founders: group.founders,
      musicalCurrent: group.musicalStyle, 
      members: group.membersCount, 
      presentation: group.presentation,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    };
  }
}

