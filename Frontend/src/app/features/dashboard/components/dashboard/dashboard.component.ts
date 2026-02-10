import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardStats, RecentActivity } from '../../../../shared/models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentActivity: RecentActivity[] = [];
  loading = true;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        
        this.stats = {
          groups: { total: 156, growth: 12 },
          venues: { total: 42, growth: 5 },
          concerts: { total: 89, growth: 23 }
        };
        this.loading = false;
      }
    });

    this.dashboardService.getRecentActivity().subscribe({
      next: (activity) => {
        this.recentActivity = activity;
      },
      error: () => {
        
        this.recentActivity = [
          {
            id: 1,
            type: 'group',
            message: 'Nouveau groupe ajouté',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            type: 'concert',
            message: 'Concert programmé',
            details: 'Daft Punk - Zénith Paris',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            type: 'venue',
            message: 'Nouvelle salle créée',
            details: 'Olympia',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          }
        ];
      }
    });
  }

  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 3600) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else if (diffInSeconds < 86400) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    } else {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `Il y a ${weeks}sem`;
    }
  }

  getActivityColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'group': 'var(--primary-purple)',
      'concert': 'var(--primary-orange)',
      'venue': 'var(--primary-teal)'
    };
    return colorMap[type] || 'var(--gray-500)';
  }
}

