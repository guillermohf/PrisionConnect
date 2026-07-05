// src/app/shared/layouts/main-layout/main-layout.component.ts

import { Component, ViewChild, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from "@shared/sidebar/side-menu.component";
import { EdgeSwipeDirective } from '@shared/directives/edge-swipe.directive';
import { VisitasMonitorService } from '@core/services/visitas-monitor.service';

@Component({
  selector: 'prisionConnect-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SideMenuComponent,
    EdgeSwipeDirective
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export default class MainLayoutComponent implements OnInit {
  
  @ViewChild('sideMenu') sideMenu!: SideMenuComponent;
  
  showSwipeHint = signal(false);

  // C5: Instanciar monitor de visitas para que corra en el background de la app
  private visitasMonitor = inject(VisitasMonitorService);

  ngOnInit(): void {
    this.visitasMonitor.start();
  }



  toggleMobileMenu(): void {
    this.sideMenu.toggleSidebar();
  }


  openSidebarMobile(): void {
    this.sideMenu.openMobile();
    // Ocultar hint cuando el usuario hace swipe
    if (this.showSwipeHint()) {
      this.showSwipeHint.set(false);
      localStorage.setItem('hasSeenSwipeHint', 'true');
    }
  }
}