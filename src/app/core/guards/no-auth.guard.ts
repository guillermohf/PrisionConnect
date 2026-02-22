import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore'; // ✅ Importamos Firestore
import { Observable } from 'rxjs';

export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const firestore = inject(Firestore);
  const router = inject(Router);

  return new Observable<boolean>((observer) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Verificamos si el usuario realmente tiene un perfil activo
          const userDoc = await getDoc(doc(firestore, `usuarios/${user.uid}`));
          const userData = userDoc.data();

          if (userDoc.exists() && userData?.['activo'] === true) {
            // ✅ Tiene sesión y está activo, lo mandamos al dashboard
            router.navigate(['/dashboard']);
            observer.next(false);
          } else {
            // ⚠️ Tiene sesión en Auth pero no está activo en Firestore
            // Le permitimos quedarse en el login (o podrías forzar un logout aquí)
            observer.next(true);
          }
        } catch (error) {
          // Si hay error de red, por seguridad permitimos el acceso al login
          observer.next(true);
        }
      } else {
        // ✅ No hay sesión, puede ver el login libremente
        observer.next(true);
      }
      observer.complete();
    });

    return () => unsubscribe();
  });
};