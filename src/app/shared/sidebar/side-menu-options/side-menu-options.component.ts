// src/app/shared/components/sidebar/side-menu-options/side-menu-options.component.ts

import { Component, input, output, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { MenuService } from '@core/services/menu.service';
import { VisitasService } from '@core/services/visitas.service';

export interface MenuOption {
  label: string;
  route: string;
  icon: string;
  subLabel?: string;
  badge?: number;
}

@Component({
  selector: 'prisionConnect-side-menu-options',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './side-menu-options.component.html',
  styleUrls: ['./side-menu-options.component.scss']
})
export class SideMenuOptionsComponent implements OnInit {

  private authService = inject(AuthService);
  private menuService = inject(MenuService);
  private visitasService = inject(VisitasService);

  // Inputs
  expanded = input.required<boolean>();

  // Outputs
  logout = output<void>();

  /**
   * Opciones del menú filtradas por rol del usuario actual.
   * Se recalculan automáticamente cuando cambia el rol o las visitas.
   */
  menuOptions = computed(() => this.menuService.menuOptions());

  ngOnInit(): void {
    // Iniciar la carga de visitas en tiempo real para que los badges
    // se alimenten del onSnapshot de Firestore desde el primer render.
    this.visitasService.cargarVisitas();
  }

  /**
   * Obtiene el badge dinámico de una ruta desde el MenuService.
   * Al ser llamado dentro de un template con signals, se recalcula automáticamente.
   */
  getBadge(ruta: string): number {
    return this.menuService.getBadgePorRuta(ruta);
  }

  onLogout(): void {
    this.authService.logout();
    this.logout.emit();
  }
}