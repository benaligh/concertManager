import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VenueService } from '../../../../core/services/venue.service';
import { Venue, VenueCreateRequest } from '../../../../shared/models/venue.model';

@Component({
  selector: 'app-venue-form',
  templateUrl: './venue-form.component.html',
  styleUrls: ['./venue-form.component.css']
})
export class VenueFormComponent implements OnInit {
  @Input() venue: Venue | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private venueService: VenueService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [this.venue?.name || '', [Validators.required]],
      capacity: [this.venue?.capacity || 0, [Validators.required, Validators.min(1)]],
      city: [this.venue?.city || '', [Validators.required]],
      address: [this.venue?.address || '', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.venue) {
      this.venueService.update({
        id: this.venue.id,
        ...formValue
      }).subscribe({
        next: () => {
          this.submit.emit();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    } else {
      this.venueService.create(formValue as VenueCreateRequest).subscribe({
        next: () => {
          this.submit.emit();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}

