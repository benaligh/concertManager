import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupsComponent } from './components/groups/groups.component';
import { GroupFormComponent } from './components/group-form/group-form.component';
import { ImportExcelModalComponent } from './components/import-excel-modal/import-excel-modal.component';
import { GroupDetailModalComponent } from './components/group-detail-modal/group-detail-modal.component';
import { GroupsRoutingModule } from './groups-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    GroupsComponent,
    GroupFormComponent,
    ImportExcelModalComponent,
    GroupDetailModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    GroupsRoutingModule,
    SharedModule
  ]
})
export class GroupsModule { }

