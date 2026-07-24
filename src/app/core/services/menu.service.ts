// src/app/core/services/menu.service.ts

import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { VisitasService } from './visitas.service';
import { RolUsuario, EstadoVisita } from '@core/models/enums.interface';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: RolUsuario[];
  subLabel?: string;
  badge?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private authService = inject(AuthService);
  private visitasService = inject(VisitasService);

  // Definición completa del menú con permisos por rol
  private readonly MENU_COMPLETO: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR
      ]
    },
    {
      label: 'Recepción',
      icon: 'pending_actions',
      route: '/visitas',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.SEGURIDAD_RECEPCION
      ],
      subLabel: 'Registro de visitas'
    },
    {
      label: 'Requisa',
      icon: 'search',
      route: '/requisa',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.SEGURIDAD_REQUISA
      ],
      subLabel: 'Control de acceso'
    },
    {
      label: 'Visitantes',
      icon: 'group',
      route: '/visitantes',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.DATA_ENTRY
      ]
    },
    {
      label: 'Reclusos',
      icon: 'person_off',
      route: '/reclusos',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.DATA_ENTRY
      ]
    },
    {
      label: 'Abogados',
      icon: 'gavel',
      route: '/abogados',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.DATA_ENTRY
      ]
    },
    {
      label: 'Visitas Activas',
      icon: 'visibility',
      route: '/visitas-activas',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR,
        RolUsuario.SEGURIDAD_REQUISA,
        RolUsuario.SEGURIDAD_PUERTA
      ],
      subLabel: 'Monitoreo en tiempo real'
    },
    {
      label: 'Reportes',
      icon: 'assessment',
      route: '/reportes',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR
      ]
    },
    {
      label: 'Auditoría',
      icon: 'history',
      route: '/auditoria',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR
      ],
      subLabel: 'Registro de actividad'
    },
    {
      label: 'Configuración',
      icon: 'settings',
      route: '/configuracion',
      roles: [RolUsuario.SUPER_ADMINISTRADOR]
    },
    {
      label: 'Usuarios',
      icon: 'admin_panel_settings',
      route: '/usuarios',
      roles: [RolUsuario.SUPER_ADMINISTRADOR],
      subLabel: 'Gestión de accesos'
    },
    {
      label: 'Perfil',
      icon: 'account_circle',
      route: '/perfil',
      roles: Object.values(RolUsuario), // Todos pueden ver su perfil
      subLabel: 'Mis datos'
    }
  ];

  // ===================================================
  // BADGES DINÁMICOS — Calculados en tiempo real desde
  // el signal `visitas` de VisitasService (onSnapshot)
  // ===================================================

  /**
   * Badge para /requisa:
   * Visitas pendientes de requisa de ENTRADA (Registrada + En Requisa Entrada)
   * y pendientes de requisa de SALIDA.
   */
  badgeRequisa = computed(() => {
    return this.visitasService.visitas().filter(v =>
      v.estado === EstadoVisita.REGISTRADA ||
      v.estado === EstadoVisita.EN_REQUISA_ENTRADA ||
      v.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA
    ).length;
  });

  /**
   * Badge para /visitas (Recepción):
   * Visitas recién registradas, pendientes de que recepción las envíe a requisa.
   */
  badgeRecepcion = computed(() => {
    return this.visitasService.visitas().filter(v =>
      v.estado === EstadoVisita.REGISTRADA
    ).length;
  });

  /**
   * Badge para /visitas-activas:
   * Visitas que están actualmente dentro del recinto (en curso o en tránsito).
   */
  badgeVisitasActivas = computed(() => {
    return this.visitasService.visitas().filter(v =>
      v.estado === EstadoVisita.EN_CURSO ||
      v.estado === EstadoVisita.EN_TRANSITO ||
      v.estado === EstadoVisita.EN_REQUISA_ENTRADA
    ).length;
  });

  /**
   * Retorna el badge dinámico de una ruta específica.
   * Llamado desde el sidebar en cada ciclo de detección de cambios.
   */
  getBadgePorRuta(ruta: string): number {
    switch (ruta) {
      case '/requisa':         return this.badgeRequisa();
      case '/visitas':         return this.badgeRecepcion();
      case '/visitas-activas': return this.badgeVisitasActivas();
      default:                 return 0;
    }
  }

  /**
   * Computed signal que filtra el menú según el rol real del Token
   */
  menuOptions = computed(() => {
    const rolActual = this.authService.userRole();
    const cargando = this.authService.loading();

    // Si está cargando o no hay rol, menú vacío
    if (cargando || !rolActual) {
      return [];
    }

    // Filtrar opciones según el rol contenido en el Token
    return this.MENU_COMPLETO.filter(item =>
      item.roles.includes(rolActual)
    );
  });

  /**
   * Verificar si el usuario tiene acceso a una ruta específica
   */
  tieneAccesoARuta(ruta: string): boolean {
    return this.menuOptions().some(item => item.route === ruta);
  }

  obtenerMenuCompleto(): MenuItem[] {
    return [...this.MENU_COMPLETO];
  }

  actualizarBadge(route: string, cantidad: number): void {
    const item = this.MENU_COMPLETO.find(i => i.route === route);
    if (item) {
      item.badge = cantidad;
    }
  }
}