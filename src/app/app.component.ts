import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'family_tree';
  showNavbar = true;
  private navSub?: Subscription;

  constructor(private readonly router: Router) {}

  ngOnInit() {
    this.navSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        const isDetail = /^\/?family\/[^/]+/.test(url) && !/^\/?family\/?$/.test(url);
        this.showNavbar = !isDetail;
      }
    });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
  }
}
