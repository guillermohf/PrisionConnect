// src/app/core/services/abogados.service.ts

import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Abogado, CrearAbogadoDTO, ActualizarAbogadoDTO } from '@core/models/abogado.interface';
import { TipoAbogado } from '@core/models/enums.interface';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AbogadosService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private abogadosCollection = collection(this.firestore, 'abogados');

  // Signals reactivos
  abogados = signal<Abogado[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.cargarAbogados();
  }

  /**
   * Cargar todos los abogados
   */
  async cargarAbogados(): Promise<void> {
    try {
      this.loading.set(true);
      this.error.set(null);

      const q = query(
        this.abogadosCollection,
        orderBy('fechaRegistro', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const abogados: Abogado[] = [];

      querySnapshot.forEach((docSnap) => {
        abogados.push({ 
          id: docSnap.id, 
          ...docSnap.data() 
        } as Abogado);
      });

      this.abogados.set(abogados);
      console.log(`✅ ${abogados.length} abogados cargados`);
    } catch (error: any) {
      console.error('❌ Error cargando abogados:', error);
      this.error.set('Error al cargar abogados');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Crear nuevo abogado
   */
  async crearAbogado(datos: CrearAbogadoDTO): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      this.loading.set(true);

      // Verificar si ya existe un abogado con esa cédula
      const existente = await this.verificarCedulaExistente(datos.cedula);
      if (existente) {
        return {
          success: false,
          message: 'Ya existe un abogado con esa cédula'
        };
      }

      // Verificar si ya existe un abogado con ese exequatur
      const existenteExequatur = await this.verificarExequaturExistente(datos.exequatur);
      if (existenteExequatur) {
        return {
          success: false,
          message: 'Ya existe un abogado con ese número de exequatur'
        };
      }

      const nombreCompleto = `${datos.nombre} ${datos.apellido}`.trim();

      const nuevoAbogado: Partial<Abogado> = {
        ...datos,
        nombreCompleto,
        activo: true,
        fechaRegistro: Timestamp.now(),
        estadisticas: {
          totalReclusos: 0,
          reclusosActivos: 0,
          totalVisitas: 0,
          ultimaVisita: null
        }
      };

      const docRef = await addDoc(this.abogadosCollection, nuevoAbogado);
      
      await this.cargarAbogados();
      
      console.log('✅ Abogado creado:', docRef.id);

      return {
        success: true,
        message: 'Abogado registrado exitosamente',
        id: docRef.id
      };
    } catch (error: any) {
      console.error('❌ Error creando abogado:', error);
      return {
        success: false,
        message: 'Error al registrar abogado: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Actualizar abogado
   */
  async actualizarAbogado(
    id: string,
    datos: ActualizarAbogadoDTO
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);

      const abogadoRef = doc(this.firestore, `abogados/${id}`);
      await updateDoc(abogadoRef, datos as any);

      await this.cargarAbogados();
      
      console.log('✅ Abogado actualizado:', id);

      return {
        success: true,
        message: 'Abogado actualizado exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error actualizando abogado:', error);
      return {
        success: false,
        message: 'Error al actualizar abogado: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Eliminar abogado (soft delete)
   */
  async eliminarAbogado(id: string): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);

      const abogadoRef = doc(this.firestore, `abogados/${id}`);
      await updateDoc(abogadoRef, { activo: false });

      await this.cargarAbogados();
      
      console.log('✅ Abogado eliminado:', id);

      return {
        success: true,
        message: 'Abogado eliminado exitosamente'
      };
    } catch (error: any) {
      console.error('❌ Error eliminando abogado:', error);
      return {
        success: false,
        message: 'Error al eliminar abogado: ' + error.message
      };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Verificar si existe un abogado con esa cédula
   */
  private async verificarCedulaExistente(cedula: string): Promise<boolean> {
    try {
      const q = query(
        this.abogadosCollection,
        where('cedula', '==', cedula),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error verificando cédula:', error);
      return false;
    }
  }

  /**
   * Verificar si existe un abogado con ese exequatur
   */
  private async verificarExequaturExistente(exequatur: string): Promise<boolean> {
    try {
      const q = query(
        this.abogadosCollection,
        where('exequatur', '==', exequatur),
        where('activo', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error verificando exequatur:', error);
      return false;
    }
  }

  /**
   * Obtener abogados filtrados
   */
  obtenerAbogadosFiltrados(filtros: {
    busqueda?: string;
    tipo?: TipoAbogado;
    activo?: boolean;
  }): Abogado[] {
    let resultado = this.abogados();

    // Filtro de búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(abogado =>
        abogado.nombreCompleto.toLowerCase().includes(busqueda) ||
        abogado.cedula.includes(busqueda) ||
        abogado.exequatur.includes(busqueda) ||
        abogado.institucion.toLowerCase().includes(busqueda)
      );
    }

    // Filtro por tipo
    if (filtros.tipo) {
      resultado = resultado.filter(abogado => abogado.tipo === filtros.tipo);
    }

    // Filtro por estado
    if (filtros.activo !== undefined) {
      resultado = resultado.filter(abogado => abogado.activo === filtros.activo);
    }

    return resultado;
  }

  

  /**
   * Obtener estadísticas de abogados
   */
  obtenerEstadisticas() {
    const todos = this.abogados();
    
    return {
      total: todos.length,
      activos: todos.filter(a => a.activo).length,
      inactivos: todos.filter(a => !a.activo).length,
      publicos: todos.filter(a => a.tipo === TipoAbogado.PUBLICO).length,
      privados: todos.filter(a => a.tipo === TipoAbogado.PRIVADO).length,
      totalReclusosAtendidos: todos.reduce((sum, a) => sum + (a.estadisticas?.totalReclusos || 0), 0)
    };
  }

    obtenerTodos(): Observable<Abogado[]> {
    return new Observable(observer => {
      const activos = this.abogados().filter(a => a.activo);
      observer.next(activos);
      observer.complete();
    });
  }

  obtenerReporte(filtros: any): Observable<any[]> {
    return new Observable(observer => {
      try {
        let abogadosFiltrados = this.abogados();

        if (filtros.abogadoId) {
          abogadosFiltrados = abogadosFiltrados.filter(a => a.id === filtros.abogadoId);
        }

        if (filtros.fechaInicio && filtros.fechaFin) {
          const inicio = new Date(filtros.fechaInicio);
          const fin = new Date(filtros.fechaFin);
          fin.setHours(23, 59, 59, 999);

          abogadosFiltrados = abogadosFiltrados.filter(a => {
            const fechaRegistro = a.fechaRegistro instanceof Timestamp 
              ? a.fechaRegistro.toDate() 
              : new Date(a.fechaRegistro);
            return fechaRegistro >= inicio && fechaRegistro <= fin;
          });
        }

        if (filtros.tipoCaso) {
          abogadosFiltrados = abogadosFiltrados.filter(a => 
            a.tipo?.toLowerCase().includes(filtros.tipoCaso.toLowerCase())
          );
        }

        const datos = abogadosFiltrados.map(a => ({
          abogado: a.nombreCompleto,
          exequatur: a.exequatur,
          tipo: a.tipo,
          recluso: 'N/A',
          tipoCaso: a.tipo || 'N/A',
          fechaAsignacion: a.fechaRegistro instanceof Timestamp 
            ? this.formatearFecha(a.fechaRegistro.toDate()) 
            : this.formatearFecha(new Date(a.fechaRegistro))
        }));

        observer.next(datos);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}