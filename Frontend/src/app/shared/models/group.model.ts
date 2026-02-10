export interface Group {
  id: number;
  name: string;
  origin: string;
  city?: string;
  startYear?: number;
  endYear?: number; 
  founders?: string;
  musicalStyle: string; 
  membersCount: number; 
  presentation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupDisplay extends Omit<Group, 'musicalStyle' | 'membersCount' | 'endYear'> {
  musicalCurrent: string; 
  members: number; 
  separationYear?: number; 
}

export interface GroupCreateRequest {
  name: string;
  origin: string;
  city?: string;
  startYear?: number;
  endYear?: number; 
  founders?: string;
  musicalStyle: string; 
  membersCount: number; 
  presentation?: string;
}

export interface ExcelGroupRow {
  'Nom du groupe': string;
  'Origine': string;
  'Ville': string;
  'Année début': number | string;
  'Année séparation': number | string;
  'Fondateurs': string;
  'Membres': number | string;
  'Courant musical': string;
  'Présentation'?: string;
}

export interface GroupUpdateRequest extends Partial<GroupCreateRequest> {
  id: number;
}

export interface GroupUpdateDisplayRequest extends Partial<Omit<GroupDisplay, 'id'>> {
  id: number;
}

