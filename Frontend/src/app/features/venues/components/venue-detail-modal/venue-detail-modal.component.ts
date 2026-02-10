import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Venue } from '../../../../shared/models/venue.model';

@Component({
  selector: 'app-venue-detail-modal',
  templateUrl: './venue-detail-modal.component.html',
  styleUrls: ['./venue-detail-modal.component.css']
})
export class VenueDetailModalComponent {
  @Input() venue: Venue | null = null;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
  }
}

