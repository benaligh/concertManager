import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ConcertDisplay } from '../../../../shared/models/concert.model';

@Component({
  selector: 'app-concert-detail-modal',
  templateUrl: './concert-detail-modal.component.html',
  styleUrls: ['./concert-detail-modal.component.css'],
  providers: [DatePipe]
})
export class ConcertDetailModalComponent {
  @Input() concert: ConcertDisplay | null = null;
  @Output() close = new EventEmitter<void>();

  constructor(public datePipe: DatePipe) {}

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onClose();
    }
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

