// src/app/core/services/relaciones-abogados.service.ts

import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

/**
 * Interface para la relación Abogado-Recluso
 */
export interface RelacionAbogado {
  id?: string;
  abogadoId: string;
  abogadoNombre: string;
  reclusoId: string;
  reclusoNombre: string;
  numeroCaso?: string;
  fechaAsignacion: Timestamp;
  fechaVencimiento?: Timestamp | null;
  activo: boolean;
  observaciones?: string;
  fechaCreacion: Timestamp;
}

/**
 * DTO para asignar abogado
 */
export interface AsignarAbogadoDTO {
  abogadoId: string;
  abogadoNombre: string;
  reclusoId: string;
  reclusoNombre: string;
  numeroCaso?: string;
  fechaVencimiento?: Date;
  observaciones?: string;
}

/**
 * DTO para actualizar relación
 */
export interface ActualizarRelacionAbogadoDTO {
  numeroCaso?: string;
  fechaVencimiento?: Date;
  activo?: boolean;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RelacionesAbogadosService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private relacionesCollection = collection(this.firestore, 'relaciones_abogados');

  // Signals reactivos
  relaciones = signal<RelacionAbogado[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /**
   * Asignar abogado a un recluso
   */
  async asignarAbogado(datos: AsignarAbogadoDTO): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      this.loading.set(true);

      // Verificar si ya existe una relación activa
      const relacionExistente = await this.verificarRelacionExistente(
        datos.abogadoId,
        datos.reclusoId
      );

      if (relacionExistente) {
        return {
          success: false,
          message: 'Este abogado ya está asignado a este recluso'
        };
      }

      const nuevaRelacion: Partial<RelacionAbogado> = {
        abogadoId: datos.abogadoId,
        abogadoNombre: datos.abogadoNombre,
        reclusoId: datos.reclusoId,
        reclusoNombre: datos.reclusoNombre,
        numeroCaso: datos.numeroCaso || '',
        fechaAsignacion: Timestamp.now(),
        fechaVencimiento: datos.fechaVencimiento 
          ? Timestamp.fromDate(new Date(datos.fechaVencimiento))
          : null,
        activo: true,
        observaciones: datos.observaciones || '',
        fechaCreacion: Timestamp.now()
      };

      const docRef = await addDoc(this.relacionesCollection, nuevaRelacion);

      console.log('✅ Abogado asignado:', docRef.id);

      return {
        success: true,
        message: 'Abogado asignado exitosamente',
        id: docRef.id
      };
    } catch (error: any) {
      console.error('❌ Error asignando abogado:', error);
      return {
        success: false,
        message: 'Error al asignar abogado: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtener abogados asignados a un recluso
   */
  async obtenerAbogadosDeRecluso(reclusoId: string): Promise<RelacionAbogado[]> {
    try {
      this.loading.set(true);

      const q = query(
        this.relacionesCollection,
        where('reclusoId', '==', reclusoId),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const relaciones: RelacionAbogado[] = [];

      querySnapshot.forEach((docSnap) => {
        relaciones.push({ 
          id: docSnap.id, 
          ...docSnap.data() 
        } as RelacionAbogado);
      });

      // Ordenar localmente por fecha de creación descendente
      relaciones.sort((a, b) => {
        const timeA = a.fechaCreacion?.seconds ?? 0;
        const timeB = b.fechaCreacion?.seconds ?? 0;
        return timeB - timeA;
      });

      console.log(`✅ ${relaciones.length} abogados asignados al recluso ${reclusoId}`);

      return relaciones;
    } catch (error: any) {
      console.error('❌ Error obteniendo abogados:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtener reclusos asignados a un abogado
   */
  async obtenerReclusosDeAbogado(abogadoId: string): Promise<RelacionAbogado[]> {
    try {
      this.loading.set(true);

      const q = query(
        this.relacionesCollection,
        where('abogadoId', '==', abogadoId),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const relaciones: RelacionAbogado[]  = [];

      querySnapshot.forEach((docSnap) => {
        relaciones.push({ 
          id: docSnap.id, 
          ...docSnap.data() 
        } as RelacionAbogado);
      });

      // Ordenar localmente por fecha de creación descendente
      relaciones.sort((a, b) => {
        const timeA = a.fechaCreacion?.seconds ?? 0;
        const timeB = b.fechaCreacion?.seconds ?? 0;
        return timeB - timeA;
      });

      console.log(`✅ ${relaciones.length} reclusos asignados al abogado ${abogadoId}`);

      return relaciones;
    } catch (error: any) {
      console.error('❌ Error obteniendo reclusos:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Actualizar relación abogado-recluso
   */
  async actualizarRelacion(
    id: string,
    datos: ActualizarRelacionAbogadoDTO
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);

      const relacionRef = doc(this.firestore, `relaciones_abogados/${id}`);

      const datosActualizacion: any = { ...datos };

      if (datos.fechaVencimiento) {
        datosActualizacion.fechaVencimiento = Timestamp.fromDate(
          new Date(datos.fechaVencimiento)
        );
      }

      await updateDoc(relacionRef, datosActualizacion);

      console.log('✅ Relación actualizada:', id);

      return {
        success: true,
        message: 'Relación actualizada exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error actualizando relación:', error);
      return {
        success: false,
        message: 'Error al actualizar relación: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Desasignar abogado (soft delete)
   */
  async desasignarAbogado(id: string): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);

      const relacionRef = doc(this.firestore, `relaciones_abogados/${id}`);

      await updateDoc(relacionRef, {
        activo: false
      });

      console.log('✅ Abogado desasignado:', id);

      return {
        success: true,
        message: 'Abogado desasignado exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error desasignando abogado:', error);
      return {
        success: false,
        message: 'Error al desasignar abogado: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Verificar si existe una relación activa
   */
  private async verificarRelacionExistente(
    abogadoId: string,
    reclusoId: string
  ): Promise<boolean> {
    try {
      const q = query(
        this.relacionesCollection,
        where('abogadoId', '==', abogadoId),
        where('reclusoId', '==', reclusoId),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('❌ Error verificando relación:', error);
      return false;
    }
  }

  /**
   * Verificar si un abogado está asignado a un recluso
   */
  async estaAsignado(abogadoId: string, reclusoId: string): Promise<boolean> {
    try {
      const q = query(
        this.relacionesCollection,
        where('abogadoId', '==', abogadoId),
        where('reclusoId', '==', reclusoId),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return false;

      // Verificar fecha de vencimiento
      const relacion = querySnapshot.docs[0].data() as RelacionAbogado;
      
      if (relacion.fechaVencimiento) {
        const fechaVenc = relacion.fechaVencimiento as Timestamp;
        const hoy = new Date();
        
        if (fechaVenc.toDate() < hoy) {
          // Relación vencida, desasignar automáticamente
          await this.desasignarAbogado(querySnapshot.docs[0].id);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error verificando asignación:', error);
      return false;
    }
  }

  /**
   * Contar abogados asignados a un recluso
   */
  async contarAbogados(reclusoId: string): Promise<number> {
    const abogados = await this.obtenerAbogadosDeRecluso(reclusoId);
    return abogados.length;
  }

  /**
   * Contar reclusos asignados a un abogado
   */
  async contarReclusos(abogadoId: string): Promise<number> {
    const reclusos = await this.obtenerReclusosDeAbogado(abogadoId);
    return reclusos.length;
  }
}