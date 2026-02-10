import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConcertsComponent } from './components/concerts/concerts.component';
import { ConcertCalendarComponent } from './components/concert-calendar/concert-calendar.component';
import { ConcertListComponent } from './components/concert-list/concert-list.component';
import { ConcertFormComponent } from './components/concert-form/concert-form.component';
import { ConcertDetailModalComponent } from './components/concert-detail-modal/concert-detail-modal.component';
import { ConcertsRoutingModule } from './concerts-routing.module';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ConcertsComponent,
    ConcertCalendarComponent,
    ConcertListComponent,
    ConcertFormComponent,
    ConcertDetailModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ConcertsRoutingModule,
    SharedModule
  ]
})
export class ConcertsModule { }

