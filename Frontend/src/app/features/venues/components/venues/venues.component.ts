import { Component, OnInit } from '@angular/core';
import { VenueService } from '../../../../core/services/venue.service';
import { Venue, VenueCreateRequest } from '../../../../shared/models/venue.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-venues',
  templateUrl: './venues.component.html',
  styleUrls: ['./venues.component.css']
})
export class VenuesComponent implements OnInit {
  venues: Venue[] = [];
  filteredVenues: Venue[] = [];
  searchTerm = '';
  filters = {
    name: '',
    city: ''
  };
  filterOptions = {
    names: [] as string[],
    cities: [] as string[]
  };
  showFilters = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  loading = false;
  showForm = false;
  selectedVenue: Venue | null = null;
  showDetailModal = false;
  selectedVenueForView: Venue | null = null;
  showConfirmModal = false;
  venueToDelete: Venue | null = null;
  confirmModalData = {
    title: 'Confirmer la suppression',
    message: '',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    type: 'danger' as const
  };
  importing = false;
  importSuccess = false;
  importError = '';
  showImportModal = false;

  constructor(private venueService: VenueService) {}

  ngOnInit(): void {
    this.loadVenues();
  }

  loadVenues(): void {
    this.loading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.filters.city) {
      params.city = this.filters.city;
    }

    this.venueService.getAll(params).subscribe({
      next: (response) => {
        this.venues = response.data;
        
        this.filteredVenues = this.filterVenues(response.data);
        this.totalItems = response.pagination?.total || response.data.length;
        this.updateFilterOptions();
        this.loading = false;
      },
      error: (error) => {
        if (environment.useMockAuth) {
          try {
            const storedVenues = localStorage.getItem('dev_venues');
            if (storedVenues) {
              const parsedVenues = JSON.parse(storedVenues);
              this.venues = parsedVenues;
              this.filteredVenues = this.filterVenues(parsedVenues);
              this.totalItems = this.filteredVenues.length;
              this.updateFilterOptions();
            } else {
              this.venues = [];
              this.filteredVenues = [];
              this.totalItems = 0;
            }
          } catch (e) {
            this.venues = [];
            this.filteredVenues = [];
            this.totalItems = 0;
          }
        } else {
          this.venues = [];
          this.filteredVenues = [];
          this.totalItems = 0;
        }
        this.loading = false;
      }
    });
  }

  private updateFilterOptions(): void {
    const names = new Set<string>();
    const cities = new Set<string>();

    this.venues.forEach(venue => {
      if (venue.name) names.add(venue.name);
      if (venue.city) cities.add(venue.city);
    });

    this.filterOptions.names = Array.from(names).sort();
    this.filterOptions.cities = Array.from(cities).sort();
  }

  private filterVenues(venues: Venue[]): Venue[] {
    let filtered = venues;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(venue => 
        venue.name.toLowerCase().includes(search) ||
        venue.city.toLowerCase().includes(search) ||
        venue.address.toLowerCase().includes(search)
      );
    }

    if (this.filters.name) {
      filtered = filtered.filter(venue => 
        venue.name === this.filters.name
      );
    }

    if (this.filters.city) {
      filtered = filtered.filter(venue => 
        venue.city === this.filters.city
      );
    }

    return filtered;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filters = {
      name: '',
      city: ''
    };
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredVenues = this.filterVenues(this.venues);
    this.totalItems = this.filteredVenues.length;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.name || this.filters.city);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.name) count++;
    if (this.filters.city) count++;
    return count;
  }

  onSearch(): void {
    this.currentPage = 1;
    if (this.venues.length > 0) {
      this.filteredVenues = this.filterVenues(this.venues);
      this.totalItems = this.filteredVenues.length;
    } else {
      this.loadVenues();
    }
  }

  onAdd(): void {
    this.selectedVenue = null;
    this.showForm = true;
  }

  onView(venue: Venue): void {
    this.selectedVenueForView = venue;
    this.showDetailModal = true;
  }

  onEdit(venue: Venue): void {
    this.selectedVenue = venue;
    this.showForm = true;
  }

  onDelete(venue: Venue): void {
    this.venueToDelete = venue;
    this.confirmModalData.message = `Êtes-vous sûr de vouloir supprimer la salle "${venue.name}" ? Cette action est irréversible.`;
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (this.venueToDelete) {
      const venue = this.venueToDelete;
      this.venueService.delete(venue.id).subscribe({
        next: () => {
          this.loadVenues();
          this.showConfirmModal = false;
          this.venueToDelete = null;
        },
        error: () => {
          this.venues = this.venues.filter(v => v.id !== venue.id);
          this.filteredVenues = this.filterVenues(this.venues);
          this.totalItems = this.filteredVenues.length;
          this.updateFilterOptions();
          
          try {
            localStorage.setItem('dev_venues', JSON.stringify(this.venues));
          } catch (error) {
            }
          this.showConfirmModal = false;
          this.venueToDelete = null;
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.venueToDelete = null;
  }

  onFormClose(): void {
    this.showForm = false;
    this.selectedVenue = null;
  }

  onDetailModalClose(): void {
    this.showDetailModal = false;
    this.selectedVenueForView = null;
  }

  onFormSubmit(): void {
    this.loadVenues();
    this.onFormClose();
    
    if (this.venues.length > 0) {
      this.updateFilterOptions();
      this.applyFilters();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      if (this.venues.length > 0) {
        this.applyFilters();
      } else {
        this.loadVenues();
      }
    }
  }

  triggerFileInput(): void {
    this.showImportModal = true;
  }

  onImportModalClose(): void {
    this.showImportModal = false;
  }

  onImportModalSuccess(result: { success: number; total: number; errors: string[] }): void {
    this.showImportModal = false;
    this.importing = false;
    this.importError = '';
    
    if (result.success > 0) {
      this.importSuccess = true;
      this.importError = `${result.success} salle(s) importée(s) avec succès sur ${result.total}.`;
      
      if (result.errors.length > 0) {
        this.importError += ` ${result.errors.length} erreur(s) détectée(s).`;
        }
      
      this.loadVenues(); 
    } else {
      this.importError = `Aucune salle n'a pu être importée. ${result.errors.length} erreur(s).`;
      if (result.errors.length > 0) {
        }
    }

    setTimeout(() => {
      this.importSuccess = false;
      this.importError = '';
    }, 10000); 
  }
}

