import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ConcertService } from '../../../../core/services/concert.service';
import { GroupService } from '../../../../core/services/group.service';
import { VenueService } from '../../../../core/services/venue.service';
import { ConcertDisplay } from '../../../../shared/models/concert.model';
import { GroupDisplay } from '../../../../shared/models/group.model';
import { Venue } from '../../../../shared/models/venue.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  concerts: ConcertDisplay[];
}

@Component({
  selector: 'app-concert-calendar',
  templateUrl: './concert-calendar.component.html',
  styleUrls: ['./concert-calendar.component.css']
})
export class ConcertCalendarComponent implements OnInit {
  currentDate = new Date();
  calendarDays: CalendarDay[] = [];
  concerts: ConcertDisplay[] = [];
  groups: GroupDisplay[] = [];
  venues: Venue[] = [];

  constructor(
    private concertService: ConcertService,
    private groupService: GroupService,
    private venueService: VenueService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.concertService.getAll({
      page: 1,
      limit: 1000 
    }).subscribe({
      next: (response) => {
        this.concerts = response.data;
        this.buildCalendar();
        this.cdr.detectChanges();
      },
      error: () => {
        this.concerts = [
          {
            id: 1,
            groupId: 1,
            groupName: 'Daft Punk',
            venueId: 1,
            venueName: 'Zénith de Paris',
            date: '2026-03-15',
            time: '20:00',
            duration: 120,
            status: 'confirmed'
          },
          {
            id: 2,
            groupId: 2,
            groupName: 'Arctic Monkeys',
            venueId: 2,
            venueName: 'Olympia',
            date: '2026-03-20',
            time: '19:30',
            duration: 90,
            status: 'planned'
          }
        ];
        this.buildCalendar();
      }
    });

    this.groupService.getAll().subscribe({
      next: (response) => {
        this.groups = response.data;
      },
      error: () => {
        this.groups = [];
      }
    });

    this.venueService.getAll().subscribe({
      next: (response) => {
        this.venues = response.data;
      },
      error: () => {
        this.venues = [];
      }
    });
  }

  buildCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    this.calendarDays = [];
    const currentDate = new Date(startDate);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    for (let i = 0; i < 42; i++) {
      const currentDateStr = formatDate(currentDate);

      const dayConcerts = this.concerts.filter(c => {
        const concertDateStr = c.date.split('T')[0];
        return concertDateStr === currentDateStr;
      });

      this.calendarDays.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        concerts: dayConcerts
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.loadData();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.loadData();
  }

  getMonthName(): string {
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[this.currentDate.getMonth()];
  }

  getDayName(day: number): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[day];
  }
}

