import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  currentRoute = '';
  breadcrumbs: string[] = [];
  pageTitle = '';

  constructor(
    private router: Router,
    public authService: AuthService
  ) {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateBreadcrumbs(event.url);
      });
    
    this.updateBreadcrumbs(this.router.url);
  }

  private updateBreadcrumbs(url: string): void {
    this.currentRoute = url;
    const segments = url.split('/').filter(s => s);
    
    this.breadcrumbs = ['Accueil'];
    if (segments.length > 0) {
      const routeMap: { [key: string]: string } = {
        'groups': 'Groupes',
        'venues': 'Salles',
        'concerts': 'Concerts'
      };
      
      segments.forEach(segment => {
        if (routeMap[segment]) {
          this.breadcrumbs.push(routeMap[segment]);
        }
      });
    }

    this.updatePageTitle();
  }

  private updatePageTitle(): void {
    const titleMap: { [key: string]: string } = {
      '/': 'Dashboard',
      '/groups': 'Gestion des Groupes',
      '/venues': 'Gestion des Salles',
      '/concerts': 'Programmation des Concerts'
    };
    
    this.pageTitle = titleMap[this.currentRoute] || 'Dashboard';
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  getBreadcrumbLink(crumb: string): string {
    if (crumb === 'Accueil') {
      return '/';
    }
    const routeMap: { [key: string]: string } = {
      'Groupes': '/groups',
      'Salles': '/venues',
      'Concerts': '/concerts'
    };
    return routeMap[crumb] || '/';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

