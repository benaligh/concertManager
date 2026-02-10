import { Component, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ConcertListComponent } from '../concert-list/concert-list.component';
import { ConcertCalendarComponent } from '../concert-calendar/concert-calendar.component';

@Component({
  selector: 'app-concerts',
  templateUrl: './concerts.component.html',
  styleUrls: ['./concerts.component.css']
})
export class ConcertsComponent implements AfterViewInit {
  viewMode: 'calendar' | 'list' = 'calendar';
  showForm = false;
  selectedConcert: any = null;

  @ViewChild('concertList') concertListComponent?: ConcertListComponent;
  @ViewChild('concertCalendar') concertCalendarComponent?: ConcertCalendarComponent;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    
  }

  onViewChange(mode: 'calendar' | 'list'): void {
    this.viewMode = mode;
    
    setTimeout(() => {
      if (mode === 'list' && this.concertListComponent) {
        this.concertListComponent.loadConcerts();
      } else if (mode === 'calendar' && this.concertCalendarComponent) {
        this.concertCalendarComponent.loadData();
      }
    }, 0);
  }

  onAdd(): void {
    this.selectedConcert = null;
    this.showForm = true;
  }

  onEditConcert(concert: any): void {
    this.selectedConcert = concert;
    this.showForm = true;
  }

  onFormClose(): void {
    this.showForm = false;
    this.selectedConcert = null;
  }

  onFormSubmit(): void {
    this.showForm = false;
    this.selectedConcert = null;

    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.viewMode === 'list') {
        if (this.concertListComponent) {
          this.concertListComponent.loadConcerts();
        } else {
          }
      } else if (this.viewMode === 'calendar') {
        if (this.concertCalendarComponent) {
          this.concertCalendarComponent.loadData();
        } else {
          }
      }
    }, 100);
  }
}

