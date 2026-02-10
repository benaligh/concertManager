import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
  @Input() data: ConfirmModalData | null = null;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancel();
    }
  }

  getIconColor(): string {
    switch (this.data?.type) {
      case 'danger':
        return 'var(--primary-red)';
      case 'warning':
        return 'var(--primary-orange)';
      default:
        return 'var(--primary-blue)';
    }
  }

  getHeaderBg(): string {
    switch (this.data?.type) {
      case 'danger':
        return 'linear-gradient(135deg, #FEE2E2 0%, rgba(239, 68, 68, 0.05) 100%)';
      case 'warning':
        return 'linear-gradient(135deg, #FED7AA 0%, rgba(249, 115, 22, 0.05) 100%)';
      default:
        return 'linear-gradient(135deg, #DBEAFE 0%, rgba(59, 130, 246, 0.05) 100%)';
    }
  }

  getIconBg(): string {
    switch (this.data?.type) {
      case 'danger':
        return 'linear-gradient(135deg, var(--primary-red) 0%, #DC2626 100%)';
      case 'warning':
        return 'linear-gradient(135deg, var(--primary-orange) 0%, #EA580C 100%)';
      default:
        return 'linear-gradient(135deg, var(--primary-blue) 0%, #2563EB 100%)';
    }
  }
}

