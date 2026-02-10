import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VenuesComponent } from './components/venues/venues.component';
import { VenueFormComponent } from './components/venue-form/venue-form.component';
import { ImportExcelModalVenueComponent } from './components/import-excel-modal/import-excel-modal.component';
import { VenueDetailModalComponent } from './components/venue-detail-modal/venue-detail-modal.component';
import { VenuesRoutingModule } from './venues-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    VenuesComponent,
    VenueFormComponent,
    ImportExcelModalVenueComponent,
    VenueDetailModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    VenuesRoutingModule,
    SharedModule
  ]
})
export class VenuesModule { }

