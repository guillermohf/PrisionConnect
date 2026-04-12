// src/app/shared/components/sidebar/side-menu-options/side-menu-options.component.ts

import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

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

  // Inputs
  expanded = input.required<boolean>();

  // Outputs
  logout = output<void>();

  // Opciones del menú
  menuOptions = signal<MenuOption[]>([
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      subLabel: 'Panel principal'
    },
    {
      label: 'Recepción',
      route: '/visitas',
      icon: 'how_to_reg',
      subLabel: 'Gestión de Visitas'
    },
    {
      label: 'Requisa',
      route: '/requisa',
      icon: 'search',
      subLabel: 'Control de acceso'
    },
    {
      label: 'Visitantes',
      route: '/visitantes',
      icon: 'people',
      subLabel: 'Gestión de visitantes'
    },
    {
      label: 'Reclusos',
      route: '/reclusos',
      icon: 'person',
      subLabel: 'Gestión de reclusos'
    },
    {
      label: 'Abogados',
      route: '/abogados',
      icon: 'gavel',
      subLabel: 'Gestión de abogados'
    },
    {
      label: 'Visitas Activas',
      route: '/visitas-activas',
      icon: 'visibility',
      subLabel: 'Monitoreo en tiempo real'
    },

    {
      label: 'Reportes',
      route: '/reportes',
      icon: 'assessment',
      subLabel: 'Análisis y estadísticas'
    },
    {
      label: 'Configuración',
      route: '/configuracion',
      icon: 'settings',
      subLabel: 'Ajustes del sistema'
    },
    {
      label: 'Usuarios',
      route: '/usuarios',
      icon: 'group',
      subLabel: 'Gestión de accesos'
    },
    {
      label: 'Perfil',
      route: '/perfil',
      icon: 'account_circle',
      subLabel: 'Mi cuenta'
    }
  ]);

  ngOnInit(): void {
    // Aquí podrías cargar badges dinámicos desde un servicio
    // Por ejemplo, cantidad de visitas pendientes, alertas, etc.
    this.loadBadges();
  }

  private loadBadges(): void {

    this.menuOptions.update(options => 
      options.map(opt => {
        if (opt.route === '/visitas-activas') {
          return { ...opt, badge: 5 }; // 5 visitas activas
        }
        return opt;
      })
    );
    
  }

  onLogout(): void {
    this.authService.logout();
    this.logout.emit();
  }
}