import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GroupService } from '../../../../core/services/group.service';
import { GroupDisplay, GroupCreateRequest } from '../../../../shared/models/group.model';

@Component({
  selector: 'app-group-form',
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.css']
})
export class GroupFormComponent implements OnInit {
  @Input() group: GroupDisplay | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  currentYear = new Date().getFullYear();

  constructor(
    private fb: FormBuilder,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [this.group?.name || '', [Validators.required]],
      origin: [this.group?.origin || '', [Validators.required]],
      city: [this.group?.city || ''],
      startYear: [this.group?.startYear || null],
      separationYear: [this.group?.separationYear || null],
      founders: [this.group?.founders || ''],
      musicalCurrent: [this.group?.musicalCurrent || '', [Validators.required]],
      members: [this.group?.members || 1, [Validators.required, Validators.min(1)]],
      presentation: [this.group?.presentation || '']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.group) {
      
      this.groupService.update({
        id: this.group.id,
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
      
      const backendData: GroupCreateRequest = {
        name: formValue.name,
        origin: formValue.origin,
        city: formValue.city,
        startYear: formValue.startYear,
        endYear: formValue.separationYear, 
        founders: formValue.founders,
        musicalStyle: formValue.musicalCurrent, 
        membersCount: formValue.members, 
        presentation: formValue.presentation
      };

      this.groupService.create(backendData).subscribe({
        next: () => {
          this.submit.emit();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}

