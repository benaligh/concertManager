export type ConcertStatus = 'planned' | 'confirmed' | 'cancelled' | 'completed' | 'postponed';

export interface Concert {
  id: number;
  date: string;
  time: string;
  duration: number; 
  status: ConcertStatus;
  group?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  salle?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ConcertDisplay {
  id: number;
  groupId: number;
  groupName?: string;
  venueId: number;
  venueName?: string;
  date: string;
  time: string;
  duration: number; 
  status: ConcertStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConcertCreateRequest {
  groupId: number;
  salleId: number; 
  date: string;
  time: string;
  duration: number; 
  status: ConcertStatus;
}

export interface ConcertUpdateRequest extends Partial<ConcertCreateRequest> {
  id: number;
}

export interface ConcertUpdateDisplayRequest extends Partial<Omit<ConcertDisplay, 'id'>> {
  id: number;
}

