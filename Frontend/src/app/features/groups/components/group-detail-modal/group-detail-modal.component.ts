import { Component, Input, Output, EventEmitter } from '@angular/core';
import { GroupDisplay } from '../../../../shared/models/group.model';

@Component({
  selector: 'app-group-detail-modal',
  templateUrl: './group-detail-modal.component.html',
  styleUrls: ['./group-detail-modal.component.css']
})
export class GroupDetailModalComponent {
  @Input() group: GroupDisplay | null = null;
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

