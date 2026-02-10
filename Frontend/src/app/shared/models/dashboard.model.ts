export interface DashboardStats {
  groups: {
    total: number;
    growth: number;
  };
  venues: {
    total: number;
    growth: number;
  };
  concerts: {
    total: number;
    growth: number;
  };
}

export interface RecentActivity {
  id: number;
  type: 'group' | 'concert' | 'venue';
  message: string;
  details?: string;
  timestamp: string;
}

