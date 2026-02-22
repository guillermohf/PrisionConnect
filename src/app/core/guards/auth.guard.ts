import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore'; // ✅ Importamos Firestore
import { Observable } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const firestore = inject(Firestore); // ✅ Inyectamos Firestore
  const router = inject(Router);

  return new Observable<boolean>((observer) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Verificar si el usuario existe y está ACTIVO en la base de datos
          const userDoc = await getDoc(doc(firestore, `usuarios/${user.uid}`));
          const userData = userDoc.data();

          if (userDoc.exists() && userData?.['activo'] === true) {
            // ✅ Usuario logueado y cuenta activa
            observer.next(true);
          } else {
            // ❌ Usuario logueado pero cuenta desactivada o sin perfil
            console.warn('Acceso denegado: Usuario inactivo o sin perfil en Firestore');
            router.navigate(['/login']);
            observer.next(false);
          }
        } catch (error) {
          console.error('Error al validar cuenta:', error);
          router.navigate(['/login']);
          observer.next(false);
        }
      } else {
        // ❌ No hay sesión iniciada
        router.navigate(['/login']);
        observer.next(false);
      }
      observer.complete();
    });

    return () => unsubscribe();
  });
};