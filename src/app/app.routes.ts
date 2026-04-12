import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { roleGuard } from '@core/guards/role.guard';
import { noAuthGuard } from '@core/guards/no-auth.guard';
import { RolUsuario } from '@core/models/enums.interface';

export const routes: Routes = [
  // ============================================
  // RUTAS PÚBLICAS (Sin sesión iniciada)
  // ============================================
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component'),
    canActivate: [noAuthGuard] // Expulsa al dashboard si ya está logueado
  },

  // ============================================
  // MAIN LAYOUT (Requiere autenticación base)
  // ============================================
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component'),
    canActivate: [authGuard], // Protege todo el bloque interior
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      // ============================================
      // DASHBOARD - Acceso general para autenticados
      // ============================================
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },

      // ============================================
      // VISITANTES - Gestión administrativa y Recepción
      // ============================================
      {
        path: 'visitantes',
        loadComponent: () => import('./pages/visitantes/visitantes.component'),
        canActivate: [roleGuard],
        data: {
          roles: [
            RolUsuario.SUPER_ADMINISTRADOR,
            RolUsuario.SUPERVISOR,
            RolUsuario.DATA_ENTRY,
            RolUsuario.SEGURIDAD_RECEPCION
          ]
        }
      },

      // ============================================
      // VISITAS - Gestión de flujos de entrada/salida
      // ============================================
      { 
        path: 'visitas',
        loadComponent: () => import('./pages/recepcion/visitas.component'),
        canActivate: [roleGuard],
        data: {
          roles: [
            RolUsuario.SUPER_ADMINISTRADOR,
            RolUsuario.SUPERVISOR,
            RolUsuario.SEGURIDAD_RECEPCION,
            RolUsuario.SEGURIDAD_REQUISA
          ]
        }
      },

      // ============================================
      // VISITAS ACTIVAS - Control operativo
      // ============================================
      { 
        path: 'visitas-activas',
        loadComponent: () => import('./pages/visitas-activas/visitas-activas.component'),
        canActivate: [roleGuard],
        data: {
          roles: [
            RolUsuario.SUPER_ADMINISTRADOR,
            RolUsuario.SUPERVISOR,
            RolUsuario.SEGURIDAD_RECEPCION,
            RolUsuario.SEGURIDAD_REQUISA
          ]
        }
      },

      // ============================================
      // REQUISA - Seguridad especializada
      // ============================================
      { 
        path: 'requisa',
        loadComponent: () => import('./pages/requisa/requisa.component'),
        canActivate: [roleGuard],
        data: {
          roles: [
            RolUsuario.SUPER_ADMINISTRADOR,
            RolUsuario.SUPERVISOR,
            RolUsuario.SEGURIDAD_REQUISA
          ]
        }
      },

      // ============================================
      // RECLUSOS / ABOGADOS - Base de Datos
      // ============================================
      {
        path: 'reclusos',
        loadComponent: () => import('./pages/reclusos/reclusos.component'),
        canActivate: [roleGuard],
        data: {
          roles: [RolUsuario.SUPER_ADMINISTRADOR, RolUsuario.SUPERVISOR, RolUsuario.DATA_ENTRY]
        }
      },
      {
        path: 'abogados',
        loadComponent: () => import('./pages/abogados/abogados.component'),
        canActivate: [roleGuard],
        data: {
          roles: [RolUsuario.SUPER_ADMINISTRADOR, RolUsuario.SUPERVISOR, RolUsuario.DATA_ENTRY]
        }
      },

      // ============================================
      // REPORTES / USUARIOS / CONFIGURACIÓN - Alta Gerencia
      // ============================================
      {
        path: 'reportes',
        loadComponent: () => import('./pages/reportes/reportes.component'),
        canActivate: [roleGuard],
        data: {
          roles: [RolUsuario.SUPER_ADMINISTRADOR, RolUsuario.SUPERVISOR]
        }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.component'), // Asegúrate que el archivo tenga "export default"
        canActivate: [roleGuard],
        data: { roles: [RolUsuario.SUPER_ADMINISTRADOR] }
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/configuracion/configuracion.component'),
        canActivate: [roleGuard],
        data: {
          roles: [RolUsuario.SUPER_ADMINISTRADOR]
        }
      },

      // ============================================
      // PERFIL - Acceso libre para cualquier usuario logueado
      // ============================================
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.component') // Asegúrate que el archivo tenga "export default"
      }
    ]
  },

  // ============================================
  // PÁGINAS DE ERROR (Fuera del layout principal)
  // ============================================
  {
    path: 'unauthorized',
    loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];