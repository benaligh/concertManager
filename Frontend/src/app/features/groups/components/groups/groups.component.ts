import { Component, OnInit } from '@angular/core';
import { GroupService } from '../../../../core/services/group.service';
import { GroupDisplay, GroupCreateRequest } from '../../../../shared/models/group.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.css']
})
export class GroupsComponent implements OnInit {
  groups: GroupDisplay[] = [];
  filteredGroups: GroupDisplay[] = [];
  searchTerm = '';
  filters = {
    name: '',
    origin: '',
    founders: '',
    musicalCurrent: ''
  };
  filterOptions = {
    names: [] as string[],
    origins: [] as string[],
    founders: [] as string[],
    musicalCurrents: [] as string[]
  };
  showFilters = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  loading = false;
  showForm = false;
  selectedGroup: GroupDisplay | null = null;
  showDetailModal = false;
  selectedGroupForView: GroupDisplay | null = null;
  showConfirmModal = false;
  groupToDelete: GroupDisplay | null = null;
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

  constructor(private groupService: GroupService) {}

  ngOnInit(): void {
    this.loadGroups();
  }

  private updateFilterOptions(): void {
    const names = new Set<string>();
    const origins = new Set<string>();
    const founders = new Set<string>();
    const musicalCurrents = new Set<string>();

    this.groups.forEach(group => {
      if (group.name) names.add(group.name);
      if (group.origin) origins.add(group.origin);
      if (group.founders) founders.add(group.founders);
      if (group.musicalCurrent) musicalCurrents.add(group.musicalCurrent);
    });

    this.filterOptions.names = Array.from(names).sort();
    this.filterOptions.origins = Array.from(origins).sort();
    this.filterOptions.founders = Array.from(founders).sort();
    this.filterOptions.musicalCurrents = Array.from(musicalCurrents).sort();
  }

  loadGroups(): void {
    this.loading = true;

    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage
    };

    if (this.filters.name) {
      params.name = this.filters.name;
    }
    if (this.filters.musicalCurrent) {
      params.musicalStyle = this.filters.musicalCurrent; 
    }

    if (this.searchTerm && !this.filters.name) {
      params.name = this.searchTerm;
    }

    this.groupService.getAll(params).subscribe({
      next: (response) => {
        this.groups = response.data;
        
        this.filteredGroups = this.filterGroups(response.data);
        this.totalItems = response.pagination?.total || response.data.length;
        this.updateFilterOptions();
        this.loading = false;
      },
      error: (error) => {
        if (environment.useMockAuth) {
          try {
            const storedGroups = localStorage.getItem('dev_groups');
            if (storedGroups) {
              const parsedGroups = JSON.parse(storedGroups);
              this.groups = parsedGroups;
              this.filteredGroups = this.filterGroups(parsedGroups);
              this.totalItems = this.filteredGroups.length;
              this.updateFilterOptions();
            } else {
              this.groups = [];
              this.filteredGroups = [];
              this.totalItems = 0;
            }
          } catch (e) {
            this.groups = [];
            this.filteredGroups = [];
            this.totalItems = 0;
          }
        } else {
          this.groups = [];
          this.filteredGroups = [];
          this.totalItems = 0;
        }
        this.loading = false;
      }
    });
  }

  private filterGroups(groups: GroupDisplay[]): GroupDisplay[] {
    let filtered = groups;

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.name.toLowerCase().includes(search) ||
        group.origin.toLowerCase().includes(search) ||
        (group.musicalCurrent && group.musicalCurrent.toLowerCase().includes(search)) ||
        (group.founders && group.founders.toLowerCase().includes(search))
      );
    }

    if (this.filters.name) {
      filtered = filtered.filter(group => 
        group.name === this.filters.name
      );
    }

    if (this.filters.origin) {
      filtered = filtered.filter(group => 
        group.origin === this.filters.origin
      );
    }

    if (this.filters.founders) {
      filtered = filtered.filter(group => 
        group.founders === this.filters.founders
      );
    }

    if (this.filters.musicalCurrent) {
      filtered = filtered.filter(group => 
        group.musicalCurrent === this.filters.musicalCurrent
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
      origin: '',
      founders: '',
      musicalCurrent: ''
    };
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredGroups = this.filterGroups(this.groups);
    this.totalItems = this.filteredGroups.length;
    this.currentPage = 1;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.name ||
      this.filters.origin ||
      this.filters.founders ||
      this.filters.musicalCurrent
    );
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.filters.name) count++;
    if (this.filters.origin) count++;
    if (this.filters.founders) count++;
    if (this.filters.musicalCurrent) count++;
    return count;
  }

  onSearch(): void {
    this.currentPage = 1;
    if (this.groups.length > 0) {
      
      this.filteredGroups = this.filterGroups(this.groups);
      this.totalItems = this.filteredGroups.length;
    } else {
      this.loadGroups();
    }
  }

  onAdd(): void {
    this.selectedGroup = null;
    this.showForm = true;
  }

  onView(group: GroupDisplay): void {
    this.selectedGroupForView = group;
    this.showDetailModal = true;
  }

  onEdit(group: GroupDisplay): void {
    this.selectedGroup = group;
    this.showForm = true;
  }

  onDelete(group: GroupDisplay): void {
    this.groupToDelete = group;
    this.confirmModalData.message = `Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ? Cette action est irréversible.`;
    this.showConfirmModal = true;
  }

  onConfirmDelete(): void {
    if (this.groupToDelete) {
      const group = this.groupToDelete;
      this.groupService.delete(group.id).subscribe({
        next: () => {
          this.loadGroups();
          this.showConfirmModal = false;
          this.groupToDelete = null;
        },
        error: (error) => {
          if (environment.useMockAuth) {
            this.groups = this.groups.filter(g => g.id !== group.id);
            this.filteredGroups = this.filterGroups(this.groups);
            this.totalItems = this.filteredGroups.length;
            
            try {
              localStorage.setItem('dev_groups', JSON.stringify(this.groups));
            } catch (e) {
              }
          }
          this.showConfirmModal = false;
          this.groupToDelete = null;
        }
      });
    }
  }

  onCancelDelete(): void {
    this.showConfirmModal = false;
    this.groupToDelete = null;
  }

  onFormClose(): void {
    this.showForm = false;
    this.selectedGroup = null;
  }

  onDetailModalClose(): void {
    this.showDetailModal = false;
    this.selectedGroupForView = null;
  }

  onFormSubmit(): void {
    
    this.loadGroups();
    this.onFormClose();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.loadGroups();
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
      this.importError = `${result.success} groupe(s) importé(s) avec succès sur ${result.total}.`;
      
      if (result.errors.length > 0) {
        this.importError += ` ${result.errors.length} erreur(s) détectée(s).`;
        }
      
      this.loadGroups(); 
    } else {
      this.importError = `Aucun groupe n'a pu être importé. ${result.errors.length} erreur(s).`;
      if (result.errors.length > 0) {
        }
    }

    setTimeout(() => {
      this.importSuccess = false;
      this.importError = '';
    }, 10000); 
  }
}

