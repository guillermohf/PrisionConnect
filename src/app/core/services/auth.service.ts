// src/app/core/services/auth.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth,
  onAuthStateChanged,
  User,
  signOut,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  onSnapshot,
  getDoc,
  collection,
  addDoc,
  Timestamp
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Usuario, RolUsuario } from '@core/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // ✅ Estados con Signals
  currentUser = signal<User | null>(null);
  usuario = signal<Usuario | null>(null); 
  loading = signal(true); 

  private userListenerUnsubscribe: (() => void) | null = null;

  // ✅ Getters reactivos (Adaptados para leer de Firestore)
  isAuthenticated = computed(() => !!this.currentUser());
  
  // ⭐ CAMBIO CLAVE: El rol ahora viene del signal 'usuario' que cargamos de Firestore
  userRole = computed(() => this.usuario()?.rol || null); 
  
  userId = computed(() => this.currentUser()?.uid || null);
  
  constructor() {
    this.initAuthListener();
  }

  private initAuthListener(): void {
    onAuthStateChanged(this.auth, async (user) => {
      this.loading.set(true);
      this.currentUser.set(user);

      if (user) {
        // En local/tesis, no buscamos claims en el token, vamos directo a Firestore
        this.escucharDatosFirestore(user.uid);
      } else {
        this.limpiarEstado();
        this.loading.set(false);
      }
    });
  }

  // ============================================
  // MÉTODOS DE AUTENTICACIÓN
  // ============================================

  async login(email: string, pass: string) {
    try {
      this.loading.set(true);
      await signInWithEmailAndPassword(this.auth, email, pass);
      // El log de acceso exitoso se registra en escucharDatosFirestore una vez que el usuario carga
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      // Registrar intento fallido directamente en Firestore (sin AuditService para evitar ciclo)
      this.registrarLogDirecto('Sistema', 'LOGIN_FALLIDO', `Intento de acceso fallido para: ${email}`, 'WARNING').catch(() => {});
      return { success: false, message: this.mapError(error.code) };
    }
  }

  async signInWithGoogle() {
    try {
      this.loading.set(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      return { success: true };
    } catch (error: any) {
      this.loading.set(false);
      console.error('Google Auth Error:', error);
      return { success: false, message: 'Error al autenticar con Google' };
    }
  }

  async logout() {
    this.loading.set(true);
    // Registrar el cierre de sesión antes de limpiar el estado
    const fbUser = this.currentUser();
    const dbUser = this.usuario();
    await this.registrarLogDirecto(
      'Sistema', 'LOGOUT',
      `Cierre de sesión: ${dbUser?.nombreCompleto || fbUser?.email || 'Usuario'}`,
      'INFO'
    ).catch(() => {});
    await signOut(this.auth);
    this.limpiarEstado();
    this.router.navigate(['/login']);
    this.loading.set(false);
  }

  // ============================================
  // HELPERS (Sincronización con Base de Datos)
  // ============================================

  private escucharDatosFirestore(uid: string) {
    const userRef = doc(this.firestore, `usuarios/${uid}`);
    
    // ⭐ El "corazón" de la seguridad para tu tesis:
    // Mantiene el rol y estado activo sincronizados en tiempo real sin Cloud Functions
    this.userListenerUnsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Usuario;
        const esNuevaSession = !this.usuario();
        this.usuario.set({ id: snap.id, ...data });
        // Registrar el login exitoso la primera vez que carga el usuario
        if (esNuevaSession) {
          this.registrarLogDirecto(
            'Sistema', 'LOGIN_EXITOSO',
            `Inicio de sesión: ${data.nombreCompleto || data.email} (Rol: ${data.rol || 'N/A'})`,
            'INFO'
          ).catch(() => {});
        }
      } else {
        console.warn('El usuario no tiene un perfil creado en Firestore');
        this.usuario.set(null);
      }
      this.loading.set(false); // Solo dejamos de cargar cuando Firestore responde
    }, (error) => {
      console.error('Error en el listener de usuario:', error);
      this.loading.set(false);
    });
  }

  private limpiarEstado() {
    if (this.userListenerUnsubscribe) {
      this.userListenerUnsubscribe();
      this.userListenerUnsubscribe = null;
    }
    this.usuario.set(null);
    this.currentUser.set(null);
  }

  // Este método ya no es necesario para tesis (Custom Claims), pero lo dejamos vacío por compatibilidad
  async refreshUserToken(): Promise<void> {
    return;
  }

  private mapError(code: string): string {
    switch (code) {
      case 'auth/user-not-found': return 'El correo electrónico no está registrado.';
      case 'auth/wrong-password': return 'La contraseña es incorrecta.';
      case 'auth/invalid-credential': return 'Credenciales inválidas. Verifique sus datos.';
      case 'auth/too-many-requests': return 'Demasiados intentos. Intente más tarde.';
      default: return 'Ocurrió un error al iniciar sesión.';
    }
  }

  // ============================================
  // CHEQUEOS DE ROLES SEGUROS (Mismo uso, origen diferente)
  // ============================================

  esSuperAdmin = computed(() => this.userRole() === RolUsuario.SUPER_ADMINISTRADOR);

  esAdminLogica = computed(() => {
    const rol = this.userRole();
    return rol ? [RolUsuario.SUPER_ADMINISTRADOR, RolUsuario.SUPERVISOR].includes(rol) : false;
  });

  puedeGestionarVisitantes = computed(() =>
    this.esAdminLogica() || this.userRole() === RolUsuario.DATA_ENTRY
  );

  /**
   * Escribe un log de auditoría directamente en Firestore.
   * Se usa en AuthService para evitar dependencia circular con AuditService.
   */
  private async registrarLogDirecto(
    modulo: string,
    accion: string,
    detalles: string,
    nivel: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  ): Promise<void> {
    const fbUser = this.currentUser();
    const dbUser = this.usuario();
    const logData = {
      modulo,
      accion,
      detalles,
      nivel,
      usuarioId: fbUser?.uid || 'SISTEMA',
      usuarioNombre: dbUser?.nombreCompleto || fbUser?.displayName || 'Usuario del Sistema',
      rolUsuario: dbUser?.rol || 'N/A',
      fecha: Timestamp.now()
    };
    await addDoc(collection(this.firestore, 'auditLogs'), logData);
  }
}