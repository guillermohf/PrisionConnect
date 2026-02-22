import { Injectable, inject, computed, Signal } from '@angular/core';
import { AuthService } from './auth.service';
import { RolUsuario } from '@core/models/enums.interface';

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

  // Definición completa del menú con permisos por rol
  private readonly MENU_COMPLETO: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
      roles: Object.values(RolUsuario) // Todos los roles tienen acceso
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
        RolUsuario.DATA_ENTRY,
        RolUsuario.SEGURIDAD_RECEPCION
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
        RolUsuario.SEGURIDAD_RECEPCION,
        RolUsuario.SEGURIDAD_REQUISA
      ],
      subLabel: 'Monitoreo en tiempo real'
    },
    {
      label: 'Historial',
      icon: 'history',
      route: '/historial',
      roles: [
        RolUsuario.SUPER_ADMINISTRADOR,
        RolUsuario.SUPERVISOR
      ],
      subLabel: 'Registro de visitas'
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