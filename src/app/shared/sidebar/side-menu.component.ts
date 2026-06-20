// src/app/shared/components/sidebar/side-menu/side-menu.component.ts

import { Component, signal, inject, OnInit, HostListener, effect, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { SideMenuHeaderComponent } from './side-menu-header/side-menu-header.component';
import { SideMenuOptionsComponent } from './side-menu-options/side-menu-options.component';
import { SwipeDirective, type SwipeDirection } from '@shared/directives/swipe.directive';
import { EdgeSwipeDirective } from '@shared/directives/edge-swipe.directive';

@Component({
  selector: 'prisionConnect-side-menu',
  standalone: true,
  imports: [
    CommonModule,
    SideMenuHeaderComponent,
    SideMenuOptionsComponent,
    SwipeDirective,
    EdgeSwipeDirective
  ],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit {
  
  private authService = inject(AuthService);
  private eRef = inject(ElementRef);

  // Estado del sidebar
  expanded = signal(true);
  isMobileOpen = signal(false);
  isMobile = signal(false);

  // Usuario actual
  user = this.authService.currentUser;

  constructor() {
    effect(() => {
      // Controlar overflow del body cuando el sidebar está abierto en mobile
      if (this.isMobile() && this.isMobileOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnInit(): void {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event): void {
    // Si estamos en desktop, el menú está expandido, y el clic fue fuera del sidebar
    if (!this.isMobile() && this.expanded() && !this.eRef.nativeElement.contains(event.target)) {
      // Colapsamos el menú
      this.expanded.set(false);
    }
  }

  private checkMobile(): void {
    const isMobileView = window.innerWidth < 1024; // lg breakpoint
    this.isMobile.set(isMobileView);
    
    if (isMobileView) {
      this.expanded.set(true); // En mobile siempre expandido cuando está abierto
      this.isMobileOpen.set(false); // Cerrado por defecto
    } else {
      this.expanded.set(true); // En desktop expandido por defecto
    }
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      // En mobile, toggle del overlay
      this.isMobileOpen.update(v => !v);
    } else {
      // En desktop, toggle de expandir/colapsar
      this.expanded.update(v => !v);
    }
  }

  openMobile(): void {
    if (this.isMobile()) {
      this.isMobileOpen.set(true);
    }
  }

  closeMobile(): void {
    if (this.isMobile()) {
      this.isMobileOpen.set(false);
    }
  }

  // Manejar gestos de swipe en el sidebar
  handleSwipe(direction: SwipeDirection): void {
    // Solo manejar swipes en mobile cuando el menú está abierto
    if (!this.isMobile() || !this.isMobileOpen()) {
      return;
    }

    // Cerrar el menú al deslizar hacia la izquierda
    if (direction === 'left') {
      this.closeMobile();
    }
  }

  // Manejar swipe desde el borde para abrir
  handleEdgeSwipe(): void {
    // Solo manejar edge swipes en mobile cuando el menú está cerrado
    if (this.isMobile() && !this.isMobileOpen()) {
      this.openMobile();
    }
  }
}