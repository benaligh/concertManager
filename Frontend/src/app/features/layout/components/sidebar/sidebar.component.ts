import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard', route: '/', icon: 'dashboard' },
    { label: 'Groupes', route: '/groups', icon: 'music' },
    { label: 'Salles', route: '/venues', icon: 'location' },
    { label: 'Concerts', route: '/concerts', icon: 'calendar' }
  ];

  constructor(
    public router: Router,
    private authService: AuthService
  ) {}

  isActive(route: string): boolean {
    if (route === '/') {
      return this.router.url === '/';
    }
    return this.router.url.startsWith(route);
  }

  onToggle(): void {
    this.toggle.emit();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
