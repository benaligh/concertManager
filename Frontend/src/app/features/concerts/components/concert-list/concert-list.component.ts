import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ConcertService } from '../../../../core/services/concert.service';
import { GroupService } from '../../../../core/services/group.service';
import { VenueService } from '../../../../core/services/venue.service';
import { ConcertDisplay, ConcertUpdateRequest } from '../../../../shared/models/concert.model';
import { GroupDisplay } from '../../../../shared/models/group.model';
import { Venue } from '../../../../shared/models/venue.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-concert-list',
  templateUrl: './concert-list.component.html',
  styleUrls: ['./concert-list.component.css'],
  providers: [DatePipe]
})
export class ConcertListComponent implements OnInit {
  concerts: ConcertDisplay[] = [];
  filteredConcerts: ConcertDisplay[] = [];
  searchTerm = '';
  filters = {
    group: '',
    venue: '',
    date: ''
  };
  filterOptions = {
    groups: [] as string[],
    venues: [] as string[]
  };
  showFilters = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  loading = false;
  showForm = false;
  selectedConcert: ConcertDisplay | null = null;
  viewMode: 'card' | 'table' = 'table';
  showDetailModal = false;
  selectedConcertForView: ConcertDisplay | null = null;
  showConfirmModal = false;
  concertToDelete: ConcertDisplay | null = null;
  confirmModalData = {
    title: 'Confirmer la suppression',
    message: '',
    confirmText: 'Supprimer',
    cancelText: 'Annuler',
    type: 'danger' as const
  };
  @Output() editConcert = new EventEmitter<ConcertDisplay>();

  constructor(
    private concertService: ConcertService,
    private groupService: GroupService,
    private venueService: VenueService,
    public datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadConcerts();
    this.loadFilterOptions();
  }

  loadFilterOptions(): void {
    this.groupService.getAll({ limit: 1000 }).subscribe({
      next: (response) => {
        this.filterOptions.groups = [...new Set(response.data.map(g => g.name))].sort();
      },
      error: () => {
        
        if (environment.useMockAuth) {
          try {
            const storedGroups = localStorage.getItem('dev_groups');
            if (storedGroups) {
              const groups: GroupDisplay[] = JSON.parse(storedGroups);
              this.filterOptions.groups = [...new Set(groups.map(g => g.name))].sort();
            }
          } catch (error) {
            }
        }
      }
    });

    this.venueService.getAll({ limit: 1000 }).subscribe({
      next: (response) => {
        this.filterOptions.venues = [...new Set(response.data.map(v => v.name))].sort();
      },
      error: () => {
        
        if (environment.useMockAuth) {
          try {
            const storedVenues = localStorage.getItem('dev_venues');
            if (storedVenues) {
              const venues: Venue[] = JSON.parse(storedVenues);
              this.filterOptions.venues = [...new Set(venues.map(v => v.name))].sort();
            }
          } catch (error) {
            }
        }
      }
    });
  }

  loadConcerts(): void {
    this.loading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.filters.date) {
      params.date = this.filters.date;
    }

    this.concertService.getAll(params).subscribe({
      next: (response) => {
        this.concerts = response.data;
        this.updateFilterOptions();
        this.filteredConcerts = this.filterConcerts(this.concerts);
        this.totalItems = response.pagination?.total || response.data.length;
        this.loading = false;
      },
      error: (error) => {
        if (environment.useMockAuth) {
          try {
            const storedConcerts = localStorage.getItem('dev_concerts');
            if (storedConcerts) {
              const parsedConcerts = JSON.parse(storedConcerts);
              this.concerts = parsedConcerts;
            } else {
              this.concerts = [
                {
                  id: 1,
                  groupId: 1,
                  groupName: 'Daft Punk',
                  venueId: 1,
                  venueName: 'Zénith de Paris',
                  date: '2026-03-15',
                  time: '20:00',
                  duration: 120,
                  status: 'confirmed'
                },
                {
                  id: 2,
                  groupId: 2,
                  groupName: 'Arctic Monkeys',
                  venueId: 2,
                  venueName: 'Olympia',
                  date: '2026-03-20',
                  time: '19:30',
                  duration: 90,
                  status: 'planned'
                },
                {
                  id: 3,
                  groupId: 3,
                  groupName: 'The Weeknd',
                  venueId: 3,
                  venueName: 'Accor Arena',
                  date: '2026-04-10',
                  time: '21:00',
                  duration: 150,
                  status: 'planned'
                }
              ];
            }
            this.updateFilterOptions();
            this.filteredConcerts = this.filterConcerts(this.concerts);
            this.totalItems = this.filteredConcerts.length;
          } catch (error) {
            this.concerts = [];
            this.filteredConcerts = [];
            this.totalItems = 0;
          }
        } else {
          this.concerts = [];
          this.filteredConcerts = [];
          this.totalItems = 0;
        }
        this.loading = false;
      }
    });
  }

  private updateFilterOptions(): void {
    const groups = new Set<string>();
    const venues = new Set<string>();

    this.concerts.forEach(concert => {
      if (concert.groupName) groups.add(concert.groupName);
      if (concert.venueName) venues.add(concert.venueName);
    });

    this.filterOptions.groups = Array.from(groups).sort();
    this.filterOptions.venues = Array.from(venues).sort();
  }

  private filterConcerts(concerts: ConcertDisplay[]): ConcertDisplay[] {
    let filtered = concerts;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(concert =>
        (concert.groupName && concert.groupName.toLowerCase().includes(search)) ||
        (concert.venueName && concert.venueName.toLowerCase().includes(search))
      );
    }

    if (this.filters.group) {
      filtered = filtered.filter(concert =>
        concert.groupName === this.filters.group
      );
    }

    if (this.filters.venue) {
      filtered = filtered.filter(concert =>
        concert.venueName === this.filters.venue
      );
    }

    if (this.filters.date) {
      filtered = filtered.filter(concert =>
        concert.date === this.filters.date
      );
    }

    return filtered;
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filters = {
      group: '',
      venue: '',
      date: ''
    };
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredConcerts = this.filterConcerts(this.concerts);
    this.totalItems = this.filteredConcerts.length;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.group || this.filters.venue || this.filters.date);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.group) count++;
    if (this.filters.venue) count++;
    if (this.filters.date) count++;
    return count;
  }

  onSearch(): void {
    this.currentPage = 1;
    if (this.concerts.length > 0) {
      this.filteredConcerts = this.filterConcerts(this.concerts);
      this.totalItems = this.filteredConcerts.length;
    } else {
      this.loadConcerts();
    }
  }

  onAdd(): void {
    
  }

  onEdit(concert: ConcertDisplay): void {
    this.editConcert.emit(concert);
  }

  onDelete(concert: ConcertDisplay): void {
    this.concertToDelete = concert;
    this.confirmModalData.message = `Êtes-vous sûr de vouloir supprimer le concert de "${concert.groupName}" ? Cette action est irréversible.`;
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (this.concertToDelete) {
      const concert = this.concertToDelete;
      if (environment.useMockAuth) {
        this.concerts = this.concerts.filter(c => c.id !== concert.id);
        this.updateFilterOptions();
        this.filteredConcerts = this.filterConcerts(this.concerts);
        this.totalItems = this.filteredConcerts.length;
        try {
          localStorage.setItem('dev_concerts', JSON.stringify(this.concerts));
        } catch (error) {
          }
        this.showConfirmModal = false;
        this.concertToDelete = null;
      } else {
        this.concertService.delete(concert.id).subscribe({
          next: () => {
            this.loadConcerts();
            this.showConfirmModal = false;
            this.concertToDelete = null;
          },
          error: () => {
            
            this.showConfirmModal = false;
            this.concertToDelete = null;
          }
        });
      }
    }
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.concertToDelete = null;
  }

  onView(concert: ConcertDisplay): void {
    this.selectedConcertForView = concert;
    this.showDetailModal = true;
  }

  onDetailModalClose(): void {
    this.showDetailModal = false;
    this.selectedConcertForView = null;
  }

  onFormClose(): void {
    
  }

  onFormSubmit(): void {
    this.loadConcerts();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      if (this.concerts.length > 0) {
        this.applyFilters();
      } else {
        this.loadConcerts();
      }
    }
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h${mins}min`;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'planned': 'Planifié',
      'confirmed': 'Confirmé',
      'cancelled': 'Annulé',
      'completed': 'Terminé',
      'postponed': 'Reporté'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-badge status-${status}`;
  }
}

