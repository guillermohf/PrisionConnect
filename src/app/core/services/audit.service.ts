import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  where
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { AuditLog, AuditLogLevel } from '../models/audit.interface';

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Estado reactivo para los logs
  private logsSignal = signal<AuditLog[]>([]);
  public logs = computed(() => this.logsSignal());
  private unsubscribeSnapshot: (() => void) | null = null;

  constructor() { }

  /**
   * Registra una nueva acción en el log de auditoría.
   */
  async registrarAccion(
    modulo: string,
    accion: string,
    detalles: string,
    nivel: AuditLogLevel = 'INFO'
  ): Promise<void> {
    try {
      const fbUser = this.authService.currentUser();
      const dbUser = this.authService.usuario();

      const logData: AuditLog = {
        modulo,
        accion,
        detalles,
        nivel,
        usuarioId: fbUser?.uid || 'SISTEMA',
        usuarioNombre: dbUser?.nombreCompleto || fbUser?.displayName || 'Usuario del Sistema',
        rolUsuario: dbUser?.rol || 'N/A',
        fecha: Timestamp.now()
      };

      const auditCollection = collection(this.firestore, 'auditLogs');
      await addDoc(auditCollection, logData);
      console.log(`[AuditLog] ${nivel} - ${modulo}: ${accion}`);
    } catch (error) {
      console.error('Error al registrar log de auditoría:', error);
    }
  }

  /**
   * Inicia la escucha en tiempo real de los logs de auditoría.
   * Útil para el panel de Auditoría.
   */
  escucharLogs(limite: number = 100): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }

    const auditCollection = collection(this.firestore, 'auditLogs');
    const q = query(auditCollection, orderBy('fecha', 'desc'), limit(limite));

    this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const logsMap = snapshot.docs.map(doc => {
        const data = doc.data() as AuditLog;
        return {
          ...data,
          id: doc.id
        };
      });
      this.logsSignal.set(logsMap);
    }, (error) => {
      console.error('Error al escuchar logs de auditoría:', error);
    });
  }

  /**
   * Detiene la escucha de los logs.
   */
  detenerEscuchaLogs(): void {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
      this.unsubscribeSnapshot = null;
    }
  }

  /**
   * Obtiene logs filtrados puntualmente (sin tiempo real).
   */
  async obtenerLogsFiltrados(moduloFiltro?: string, nivelFiltro?: AuditLogLevel, limite: number = 100): Promise<AuditLog[]> {
    try {
      const auditCollection = collection(this.firestore, 'auditLogs');
      let constraints: any[] = [];

      if (moduloFiltro) {
        constraints.push(where('modulo', '==', moduloFiltro));
      }
      if (nivelFiltro) {
        constraints.push(where('nivel', '==', nivelFiltro));
      }

      constraints.push(orderBy('fecha', 'desc'));
      constraints.push(limit(limite));

      const q = query(auditCollection, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data() as AuditLog;
        return {
          ...data,
          id: doc.id
        };
      });
    } catch (error) {
      console.error('Error al obtener logs filtrados:', error);
      return [];
    }
  }
}
