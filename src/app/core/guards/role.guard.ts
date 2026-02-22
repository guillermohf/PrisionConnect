// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { RolUsuario } from '@core/models';
import { AuthService } from '@core/services/auth.service';

// src/app/core/guards/role.guard.ts
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Importante: Si el servicio está cargando datos de Firestore, debemos esperar
  return new Observable<boolean>((observer) => {
    // Usamos un interval o convertimos el signal a observable para esperar que 'loading' sea false
    const check = setInterval(() => {
      if (!authService.loading()) {
        clearInterval(check);
        const rolUsuario = authService.userRole();
        const rolesPermitidos = route.data['roles'] as Array<RolUsuario>;

        if (rolUsuario && rolesPermitidos.includes(rolUsuario)) {
          observer.next(true);
        } else {
          router.navigate(['/unauthorized']);
          observer.next(false);
        }
        observer.complete();
      }
    }, 100);
  });
};