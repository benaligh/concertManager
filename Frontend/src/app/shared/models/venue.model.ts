export interface Venue {
  id: number;
  name: string;
  capacity: number;
  city: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VenueCreateRequest {
  name: string;
  capacity: number;
  city: string;
  address: string;
}

export interface VenueUpdateRequest extends Partial<VenueCreateRequest> {
  id: number;
}

export interface ExcelVenueRow {
  'Nom': string;
  'Capacité': number | string;
  'Ville': string;
  'Adresse': string;
}

