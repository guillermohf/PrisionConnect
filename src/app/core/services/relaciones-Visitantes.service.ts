// src/app/core/services/relaciones-visitantes.service.ts

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
import { 
  RelacionVisitante, 
  ActualizarRelacionVisitanteDTO 
} from '@core/models/relacion.interface';
import { Parentesco } from '@core/models/enums.interface';
import { AuthService } from './auth.service';

/**
 * DTO para autorizar visitante (incluye nombres para desnormalización)
 */
export interface AutorizarVisitanteDTO {
  reclusoId: string;
  reclusoNombre: string;
  visitanteId: string;
  visitanteNombre: string;
  parentesco: Parentesco;
  fechaVencimiento?: Date;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RelacionesVisitantesService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private relacionesCollection = collection(this.firestore, 'relaciones_visitantes');

  // Signals reactivos
  relaciones = signal<RelacionVisitante[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  /**
   * Autorizar visitante para un recluso
   */
  async autorizarVisitante(datos: AutorizarVisitanteDTO): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      this.loading.set(true);

      // Verificar si ya existe una relación activa
      const relacionExistente = await this.verificarRelacionExistente(
        datos.reclusoId,
        datos.visitanteId
      );

      if (relacionExistente) {
        return {
          success: false,
          message: 'Este visitante ya está autorizado para este recluso'
        };
      }

      const nuevaRelacion: Partial<RelacionVisitante> = {
        reclusoId: datos.reclusoId,
        reclusoNombre: datos.reclusoNombre,
        visitanteId: datos.visitanteId,
        visitanteNombre: datos.visitanteNombre,
        parentesco: datos.parentesco,
        autorizado: true,
        fechaAutorizacion: Timestamp.now(),
        fechaVencimiento: datos.fechaVencimiento 
          ? Timestamp.fromDate(new Date(datos.fechaVencimiento))
          : null,
        activo: true,
        observaciones: datos.observaciones || '',
        fechaCreacion: Timestamp.now()
      };

      const docRef = await addDoc(this.relacionesCollection, nuevaRelacion);

      console.log('✅ Visitante autorizado:', docRef.id);

      return {
        success: true,
        message: 'Visitante autorizado exitosamente',
        id: docRef.id
      };
    } catch (error: any) {
      console.error('❌ Error autorizando visitante:', error);
      return {
        success: false,
        message: 'Error al autorizar visitante: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtener visitantes autorizados de un recluso
   * Retorna ARRAY (soporta 1 a muchos)
   */
  async obtenerVisitantesDeRecluso(reclusoId: string): Promise<RelacionVisitante[]> {
    try {
      this.loading.set(true);

      const q = query(
        this.relacionesCollection,
        where('reclusoId', '==', reclusoId),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const relaciones: RelacionVisitante[] = [];

      querySnapshot.forEach((docSnap) => {
        relaciones.push({ 
          id: docSnap.id, 
          ...docSnap.data() 
        } as RelacionVisitante);
      });

      // Ordenar localmente por fecha de creación descendente
      relaciones.sort((a, b) => {
        const getMs = (dateObj: any) => {
          if (!dateObj) return 0;
          if (typeof dateObj.toMillis === 'function') return dateObj.toMillis();
          if (dateObj.seconds !== undefined) return dateObj.seconds * 1000;
          if (dateObj instanceof Date) return dateObj.getTime();
          return new Date(dateObj).getTime();
        };
        return getMs(b.fechaCreacion) - getMs(a.fechaCreacion);
      });

      console.log(`✅ ${relaciones.length} visitantes autorizados para recluso ${reclusoId}`);

      return relaciones;
    } catch (error: any) {
      console.error('❌ Error obteniendo visitantes:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtener reclusos que puede visitar un visitante
   * Retorna ARRAY (soporta 1 a muchos)
   */
  async obtenerReclusosDeVisitante(visitanteId: string): Promise<RelacionVisitante[]> {
    try {
      this.loading.set(true);

      const q = query(
        this.relacionesCollection,
        where('visitanteId', '==', visitanteId),
        where('activo', '==', true),
        where('autorizado', '==', true),
        orderBy('fechaCreacion', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const relaciones: RelacionVisitante[] = [];

      querySnapshot.forEach((docSnap) => {
        relaciones.push({ 
          id: docSnap.id, 
          ...docSnap.data() 
        } as RelacionVisitante);
      });

      console.log(`✅ ${relaciones.length} reclusos autorizados para visitante ${visitanteId}`);

      return relaciones;
    } catch (error: any) {
      console.error('❌ Error obteniendo reclusos:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Actualizar relación visitante
   */
  async actualizarRelacion(
    id: string,
    datos: ActualizarRelacionVisitanteDTO
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);

      const relacionRef = doc(this.firestore, `relaciones_visitantes/${id}`);

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
   * Desautorizar visitante (soft delete)
   */
  async desautorizarVisitante(id: string): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);

      const relacionRef = doc(this.firestore, `relaciones_visitantes/${id}`);

      await updateDoc(relacionRef, {
        autorizado: false,
        activo: false
      });

      console.log('✅ Visitante desautorizado:', id);

      return {
        success: true,
        message: 'Visitante desautorizado exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error desautorizando visitante:', error);
      return {
        success: false,
        message: 'Error al desautorizar visitante: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Verificar si existe una relación activa
   * @private
   */
  private async verificarRelacionExistente(
    reclusoId: string,
    visitanteId: string
  ): Promise<boolean> {
    try {
      const q = query(
        this.relacionesCollection,
        where('reclusoId', '==', reclusoId),
        where('visitanteId', '==', visitanteId),
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
   * Verificar si un visitante está autorizado para un recluso
   * Incluye validación de vencimiento
   */
  async estaAutorizado(reclusoId: string, visitanteId: string): Promise<boolean> {
    try {
      const q = query(
        this.relacionesCollection,
        where('reclusoId', '==', reclusoId),
        where('visitanteId', '==', visitanteId),
        where('activo', '==', true),
        where('autorizado', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return false;

      // Verificar fecha de vencimiento
      const relacion = querySnapshot.docs[0].data() as RelacionVisitante;
      
      if (relacion.fechaVencimiento) {
        const fechaVenc = relacion.fechaVencimiento as Timestamp;
        const hoy = new Date();
        
        if (fechaVenc.toDate() < hoy) {
          // Relación vencida, desautorizar automáticamente
          await this.desautorizarVisitante(querySnapshot.docs[0].id);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error verificando autorización:', error);
      return false;
    }
  }

  /**
   * Obtener todas las relaciones activas
   */
  async cargarRelaciones(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const q = query(
        this.relacionesCollection,
        where('activo', '==', true),
        orderBy('fechaCreacion', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const relaciones: RelacionVisitante[] = [];

      querySnapshot.forEach((docSnap) => {
        relaciones.push({ 
          id: docSnap.id, 
          ...docSnap.data() 
        } as RelacionVisitante);
      });

      this.relaciones.set(relaciones);
      console.log(`✅ ${relaciones.length} relaciones cargadas`);
    } catch (error: any) {
      console.error('❌ Error cargando relaciones:', error);
      this.error.set('Error al cargar relaciones');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Contar visitantes autorizados de un recluso
   */
  async contarVisitantes(reclusoId: string): Promise<number> {
    const visitantes = await this.obtenerVisitantesDeRecluso(reclusoId);
    return visitantes.length;
  }

  /**
   * Contar reclusos que puede visitar un visitante
   */
  async contarReclusos(visitanteId: string): Promise<number> {
    const reclusos = await this.obtenerReclusosDeVisitante(visitanteId);
    return reclusos.length;
  }
}