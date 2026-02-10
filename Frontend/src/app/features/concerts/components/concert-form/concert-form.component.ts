import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConcertService } from '../../../../core/services/concert.service';
import { GroupService } from '../../../../core/services/group.service';
import { VenueService } from '../../../../core/services/venue.service';
import { ConcertDisplay, ConcertCreateRequest } from '../../../../shared/models/concert.model';
import { GroupDisplay } from '../../../../shared/models/group.model';
import { Venue } from '../../../../shared/models/venue.model';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-concert-form',
  templateUrl: './concert-form.component.html',
  styleUrls: ['./concert-form.component.css']
})
export class ConcertFormComponent implements OnInit {
  @Input() concert: ConcertDisplay | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  groups: GroupDisplay[] = [];
  venues: Venue[] = [];
  isEditMode = false;
  
  statusOptions = [
    { value: 'planned', label: 'Planifié' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'completed', label: 'Terminé' },
    { value: 'postponed', label: 'Reporté' }
  ];

  constructor(
    private fb: FormBuilder,
    private concertService: ConcertService,
    private groupService: GroupService,
    private venueService: VenueService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.concert;
    this.initForm();
    this.loadOptions();
  }

  private initForm(): void {
    this.form = this.fb.group({
      groupId: [this.concert?.groupId || '', [Validators.required]],
      venueId: [this.concert?.venueId || '', [Validators.required]],
      date: [this.concert?.date ? this.concert.date.split('T')[0] : '', [Validators.required]],
      time: [this.concert?.time || '', [Validators.required]],
      duration: [this.concert?.duration || 120, [Validators.required, Validators.min(1)]],
      status: [this.concert?.status || 'planned', [Validators.required]]
    });
  }

  private loadOptions(): void {
    this.groupService.getAll().subscribe({
      next: (response) => {
        this.groups = response.data;
      },
      error: () => {
        if (environment.useMockAuth) {
          try {
            const storedGroups = localStorage.getItem('dev_groups');
            if (storedGroups) {
              this.groups = JSON.parse(storedGroups);
            }
          } catch (error) {
          }
        }
      }
    });

    this.venueService.getAll().subscribe({
      next: (response) => {
        this.venues = response.data;
      },
      error: () => {
        if (environment.useMockAuth) {
          try {
            const storedVenues = localStorage.getItem('dev_venues');
            if (storedVenues) {
              this.venues = JSON.parse(storedVenues);
            }
          } catch (error) {
          }
        }
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    if (this.isEditMode && this.concert) {
      const updateRequest = {
        id: this.concert.id,
        groupId: this.form.value.groupId,
        venueId: this.form.value.venueId,
        date: this.form.value.date,
        time: this.form.value.time,
        duration: this.form.value.duration,
        status: this.form.value.status
      };

      this.concertService.update(updateRequest).subscribe({
        next: () => {
          this.submit.emit();
          this.loading = false;
        },
        error: (error) => {
          alert('Erreur lors de la modification du concert.');
          this.loading = false;
        }
      });
    } else {
      const durationInMinutes = Number(this.form.value.duration) || 60;
      const durationInHours = Math.max(1, Math.ceil(durationInMinutes / 60));

      if (!this.form.value.groupId || !this.form.value.venueId || !this.form.value.date || !this.form.value.time) {
        alert('Veuillez remplir tous les champs obligatoires.');
        this.loading = false;
        return;
      }
      
      const createRequest: ConcertCreateRequest = {
        groupId: Number(this.form.value.groupId),
        salleId: Number(this.form.value.venueId), 
        date: this.form.value.date,
        time: this.form.value.time,
        duration: durationInHours, 
        status: this.form.value.status || 'planned'
      };

      this.concertService.create(createRequest).subscribe({
        next: (createdConcert) => {
          this.submit.emit();
          this.loading = false;
        },
        error: (error) => {
          let errorMessage = 'Erreur lors de la création du concert.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.status === 0) {
            errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          } else if (error.status === 400) {
            errorMessage = 'Données invalides. ' + (error.error?.message || '');
          } else if (error.status === 404) {
            errorMessage = 'Groupe ou salle introuvable.';
          } else if (error.status >= 500) {
            errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          }
          
          alert(errorMessage);
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}

