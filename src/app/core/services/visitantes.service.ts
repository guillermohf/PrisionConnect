// src/app/core/services/visitantes.service.ts

import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  CollectionReference,
  DocumentData
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { 
  Visitante, 
  CrearVisitanteDTO, 
  ActualizarVisitanteDTO,
  getNombreCompleto,
  validarCedula,
  formatearCedula,
  RespuestaOperacion
} from '@core/models';
import { AuditService } from './audit.service';
import { Observable, from, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class VisitantesService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private auditService = inject(AuditService);
  private collectionName = 'visitantes';
  
  // Señal reactiva con todos los visitantes
  visitantes = signal<Visitante[]>([]);
  
  // Señal de carga
  loading = signal<boolean>(false);

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.cargarTodos();
      } else {
        this.limpiarCache();
      }
    });
  }
  


  /**
   * Crear un nuevo visitante
   */
  async crear(dto: CrearVisitanteDTO): Promise<RespuestaOperacion<Visitante>> {
    try {
      // Validar cédula
      if (!validarCedula(dto.cedula)) {
        return {
          exito: false,
          mensaje: 'Formato de cédula inválido. Use: XXX-XXXXXXX-X',
          error: 'CEDULA_INVALIDA'
        };
      }

      // Verificar si ya existe
      const existe = await this.existePorCedula(dto.cedula);
      if (existe) {
        return {
          exito: false,
          mensaje: 'Ya existe un visitante con esta cédula',
          error: 'VISITANTE_DUPLICADO'
        };
      }

      // Preparar datos
      const nuevoVisitante: Omit<Visitante, 'id'> = {
        cedula: formatearCedula(dto.cedula),
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        nombreCompleto: getNombreCompleto(dto.nombre, dto.apellido),
        telefono: dto.telefono,
        direccion: dto.direccion,
        email: dto.email?.trim() || '',
        fotoUrl: dto.fotoUrl || '',
        activo: true,
        fechaRegistro: Timestamp.now(),
        ultimaVisita: null,
        totalVisitas: 0,
        observaciones: ''
      };

      // Guardar en Firestore
      const docRef = await addDoc(
        collection(this.firestore, this.collectionName),
        nuevoVisitante
      );

      const visitanteCreado: Visitante = {
        id: docRef.id,
        ...nuevoVisitante
      };

      // Actualizar señal
      this.visitantes.update(lista => [...lista, visitanteCreado]);

      await this.auditService.registrarAccion(
        'Visitantes', 'CREAR_VISITANTE',
        `Visitante creado: ${visitanteCreado.nombreCompleto} (Céd: ${visitanteCreado.cedula})`,
        'INFO'
      );
      return {
        exito: true,
        mensaje: 'Visitante creado exitosamente',
        data: visitanteCreado
      };

    } catch (error: any) {
      console.error('Error al crear visitante:', error);
      await this.auditService.registrarAccion('Visitantes', 'ERROR_CREAR_VISITANTE', `Error: ${error.message}`, 'ERROR');
      return {
        exito: false,
        mensaje: 'Error al crear visitante',
        error: error.message
      };
    }
  }

  /**
   * Obtener visitante por ID
   */
  async obtenerPorId(id: string): Promise<Visitante | null> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Visitante;

    } catch (error) {
      console.error('Error al obtener visitante:', error);
      return null;
    }
  }


  obtenerReporte(filtros: any): Observable<any[]> {
    return from(
      getDocs(collection(this.firestore, this.collectionName)).then(snapshot => {
        let datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Excluir registros inactivos (eliminados logicamente) salvo que el filtro lo indique
        if (!filtros.incluirInactivos) {
          datos = datos.filter(v => v.activo);
        }

        // Filtro por Cédula (ignorando guiones)
        if (filtros.cedula) {
          const cedulaBuscar = filtros.cedula.replace(/-/g, '').toLowerCase();
          datos = datos.filter(v => v.cedula && v.cedula.replace(/-/g, '').toLowerCase().includes(cedulaBuscar));
        }

        // Filtro por Nacionalidad
        if (filtros.nacionalidad) {
          const nacBuscar = filtros.nacionalidad.toLowerCase().trim();
          datos = datos.filter(v => v.nacionalidad && v.nacionalidad.toLowerCase().includes(nacBuscar));
        }

        // Filtro por Género
        if (filtros.genero) {
          datos = datos.filter(v => v.genero === filtros.genero);
        }

        // Ordenar alfabéticamente por nombre
        datos.sort((a, b) => (a.nombreCompleto || '').localeCompare(b.nombreCompleto || ''));

        // Formatear datos para la tabla y PDF del reporte
        return datos.map(v => ({
          ...v,
          estadoTexto: v.activo ? 'Activo' : 'Inactivo',
          nombreCompleto: v.nombreCompleto || `${v.nombre} ${v.apellido}`,
          totalVisitas: v.totalVisitas || 0,
          parentescoConRecluso: v.parentescoConRecluso || 'No especificado',
          nacionalidad: v.nacionalidad || 'N/A',
          genero: v.genero === 'M' ? 'Masculino' : (v.genero === 'F' ? 'Femenino' : 'N/A')
        }));
      })
    );
  }
  
  /**
   * Obtener visitante por cédula
   */


  async obtenerPorCedula(cedula: string): Promise<Visitante | null> {
    try {
      const cedulaFormateada = formatearCedula(cedula);
      const q = query(
        collection(this.firestore, this.collectionName),
        where('cedula', '==', cedulaFormateada),
        limit(1)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Visitante;

    } catch (error) {
      console.error('Error al buscar visitante por cédula:', error);
      return null;
    }
  }

  /**
   * Actualizar visitante
   */
  async actualizar(
    id: string, 
    dto: ActualizarVisitanteDTO
  ): Promise<RespuestaOperacion<Visitante>> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      
      // Verificar que existe
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return {
          exito: false,
          mensaje: 'Visitante no encontrado',
          error: 'NOT_FOUND'
        };
      }

      // Preparar actualización
      const actualizacion: any = {};
      
      if (dto.telefono !== undefined) actualizacion.telefono = dto.telefono;
      if (dto.direccion !== undefined) actualizacion.direccion = dto.direccion;
      if (dto.email !== undefined) actualizacion.email = dto.email;
      if (dto.fotoUrl !== undefined) actualizacion.fotoUrl = dto.fotoUrl;
      if (dto.activo !== undefined) actualizacion.activo = dto.activo;
      if (dto.observaciones !== undefined) actualizacion.observaciones = dto.observaciones;
      if (dto.nacionalidad !== undefined) actualizacion.nacionalidad = dto.nacionalidad;
      if (dto.pasaporte !== undefined) actualizacion.pasaporte = dto.pasaporte;

      // Actualizar en Firestore
      await updateDoc(docRef, actualizacion);

      // Obtener visitante actualizado
      const visitanteActualizado = await this.obtenerPorId(id);

      if (visitanteActualizado) {
        // Actualizar señal
        this.visitantes.update(lista =>
          lista.map(v => v.id === id ? visitanteActualizado : v)
        );
      }

      await this.auditService.registrarAccion(
        'Visitantes', 'ACTUALIZAR_VISITANTE',
        `Visitante actualizado: ${visitanteActualizado?.nombreCompleto || id}`,
        'INFO'
      );
      return {
        exito: true,
        mensaje: 'Visitante actualizado exitosamente',
        data: visitanteActualizado!
      };

    } catch (error: any) {
      console.error('Error al actualizar visitante:', error);
      await this.auditService.registrarAccion('Visitantes', 'ERROR_ACTUALIZAR_VISITANTE', `Error al actualizar visitante ${id}: ${error.message}`, 'ERROR');
      return {
        exito: false,
        mensaje: 'Error al actualizar visitante',
        error: error.message
      };
    }
  }

  /**
   * Eliminar visitante (soft delete)
   */
  async eliminar(id: string): Promise<RespuestaOperacion> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      const visitante = this.visitantes().find(v => v.id === id);
      
      // Marcar como inactivo en lugar de eliminar
      await updateDoc(docRef, { activo: false });

      // Actualizar señal
      this.visitantes.update(lista =>
        lista.map(v => v.id === id ? { ...v, activo: false } : v)
      );

      await this.auditService.registrarAccion(
        'Visitantes', 'DESACTIVAR_VISITANTE',
        `Visitante desactivado: ${visitante?.nombreCompleto || id}`,
        'WARNING'
      );
      return {
        exito: true,
        mensaje: 'Visitante desactivado exitosamente'
      };

    } catch (error: any) {
      console.error('Error al eliminar visitante:', error);
      await this.auditService.registrarAccion('Visitantes', 'ERROR_DESACTIVAR_VISITANTE', `Error al desactivar visitante ${id}: ${error.message}`, 'ERROR');
      return {
        exito: false,
        mensaje: 'Error al eliminar visitante',
        error: error.message
      };
    }
  }

  /**
   * Eliminar visitante permanentemente
   */
  async eliminarPermanente(id: string): Promise<RespuestaOperacion> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      const visitante = this.visitantes().find(v => v.id === id);
      await deleteDoc(docRef);

      // Actualizar señal
      this.visitantes.update(lista => lista.filter(v => v.id !== id));

      await this.auditService.registrarAccion(
        'Visitantes', 'ELIMINAR_VISITANTE_PERMANENTE',
        `Visitante eliminado permanentemente: ${visitante?.nombreCompleto || id}`,
        'WARNING'
      );
      return {
        exito: true,
        mensaje: 'Visitante eliminado permanentemente'
      };

    } catch (error: any) {
      console.error('Error al eliminar visitante permanentemente:', error);
      await this.auditService.registrarAccion('Visitantes', 'ERROR_ELIMINAR_VISITANTE', `Error al eliminar permanente visitante ${id}: ${error.message}`, 'ERROR');
      return {
        exito: false,
        mensaje: 'Error al eliminar visitante',
        error: error.message
      };
    }
  }

  // ============================================
  // MÉTODOS DE CONSULTA
  // ============================================

  /**
   * Cargar todos los visitantes
   */
  async cargarTodos(): Promise<void> {
    try {
      this.loading.set(true);

      const q = query(
        collection(this.firestore, this.collectionName),
        orderBy('nombreCompleto', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const visitantes: Visitante[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Visitante));

      this.visitantes.set(visitantes);

    } catch (error) {
      console.error('Error al cargar visitantes:', error);
      this.visitantes.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Obtener visitantes activos
   */
  async obtenerActivos(): Promise<Visitante[]> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('activo', '==', true),
        orderBy('nombreCompleto', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Visitante));

    } catch (error) {
      console.error('Error al obtener visitantes activos:', error);
      return [];
    }
  }

  /**
   * Obtener visitantes inactivos
   */
  async obtenerInactivos(): Promise<Visitante[]> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('activo', '==', false),
        orderBy('nombreCompleto', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Visitante));

    } catch (error) {
      console.error('Error al obtener visitantes inactivos:', error);
      return [];
    }
  }

  /**
   * Buscar visitantes por nombre
   */
  async buscarPorNombre(nombre: string): Promise<Visitante[]> {
    try {
      // Firestore no soporta búsqueda parcial, así que obtenemos todos
      // y filtramos en el cliente
      const todos = this.visitantes();
      
      const nombreBusqueda = nombre.toLowerCase().trim();
      
      return todos.filter(v =>
        v.nombreCompleto.toLowerCase().includes(nombreBusqueda) ||
        v.nombre.toLowerCase().includes(nombreBusqueda) ||
        v.apellido.toLowerCase().includes(nombreBusqueda)
      );

    } catch (error) {
      console.error('Error al buscar visitantes:', error);
      return [];
    }
  }

  /**
   * Buscar visitantes por término general
   */
  async buscar(termino: string): Promise<Visitante[]> {
    try {
      const todos = this.visitantes();
      const terminoBusqueda = termino.toLowerCase().trim();
      
      return todos.filter(v =>
        v.nombreCompleto.toLowerCase().includes(terminoBusqueda) ||
        v.cedula.includes(terminoBusqueda) ||
        v.telefono.includes(terminoBusqueda) ||
        v.email?.toLowerCase().includes(terminoBusqueda)
      );

    } catch (error) {
      console.error('Error al buscar visitantes:', error);
      return [];
    }
  }

  /**
   * Obtener visitantes con más visitas
   */
  async obtenerMasActivos(limite: number = 10): Promise<Visitante[]> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('activo', '==', true),
        orderBy('totalVisitas', 'desc'),
        limit(limite)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Visitante));

    } catch (error) {
      console.error('Error al obtener visitantes más activos:', error);
      return [];
    }
  }

  // ============================================
  // MÉTODOS DE VALIDACIÓN
  // ============================================

  /**
   * Verificar si existe un visitante con la cédula
   */
  async existePorCedula(cedula: string): Promise<boolean> {
    const visitante = await this.obtenerPorCedula(cedula);
    return visitante !== null;
  }

  /**
   * Validar datos de visitante
   */
  validarDatos(dto: CrearVisitanteDTO | ActualizarVisitanteDTO): string[] {
    const errores: string[] = [];

    // Validar cédula si está presente
    if ('cedula' in dto && !validarCedula(dto.cedula)) {
      errores.push('Formato de cédula inválido');
    }

    // Validar nombre
    if ('nombre' in dto && dto.nombre.trim().length < 2) {
      errores.push('El nombre debe tener al menos 2 caracteres');
    }

    // Validar apellido
    if ('apellido' in dto && dto.apellido.trim().length < 2) {
      errores.push('El apellido debe tener al menos 2 caracteres');
    }

    // Validar teléfono
    if ('telefono' in dto && dto.telefono!.trim().length < 10) {
      errores.push('El teléfono debe tener al menos 10 dígitos');
    }

    // Validar dirección
    if ('direccion' in dto && dto.direccion!.trim().length < 5) {
      errores.push('La dirección debe tener al menos 5 caracteres');
    }

    return errores;
  }

  // ============================================
  // MÉTODOS DE ACTUALIZACIÓN DE ESTADÍSTICAS
  // ============================================

  /**
   * Actualizar última visita
   */
  async actualizarUltimaVisita(id: string, fecha: Date): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      await updateDoc(docRef, {
        ultimaVisita: Timestamp.fromDate(fecha)
      });

      // Actualizar señal
      this.visitantes.update(lista =>
        lista.map(v => v.id === id 
          ? { ...v, ultimaVisita: Timestamp.fromDate(fecha) } 
          : v
        )
      );

    } catch (error) {
      console.error('Error al actualizar última visita:', error);
    }
  }

  /**
   * Incrementar contador de visitas
   */
  async incrementarVisitas(id: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const totalActual = docSnap.data()['totalVisitas'] || 0;
        await updateDoc(docRef, {
          totalVisitas: totalActual + 1,
          ultimaVisita: Timestamp.now()
        });

        // Actualizar señal
        this.visitantes.update(lista =>
          lista.map(v => v.id === id 
            ? { ...v, totalVisitas: totalActual + 1, ultimaVisita: Timestamp.now() } 
            : v
          )
        );
      }

    } catch (error) {
      console.error('Error al incrementar visitas:', error);
    }
  }

  /**
   * Activar visitante
   */
  async activar(id: string): Promise<RespuestaOperacion> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      await updateDoc(docRef, { activo: true });

      // Actualizar señal
      this.visitantes.update(lista =>
        lista.map(v => v.id === id ? { ...v, activo: true } : v)
      );

      return {
        exito: true,
        mensaje: 'Visitante activado exitosamente'
      };

    } catch (error: any) {
      console.error('Error al activar visitante:', error);
      return {
        exito: false,
        mensaje: 'Error al activar visitante',
        error: error.message
      };
    }
  }

  /**
   * Desactivar visitante
   */
  async desactivar(id: string): Promise<RespuestaOperacion> {
    try {
      const docRef = doc(this.firestore, this.collectionName, id);
      await updateDoc(docRef, { activo: false });

      // Actualizar señal
      this.visitantes.update(lista =>
        lista.map(v => v.id === id ? { ...v, activo: false } : v)
      );

      return {
        exito: true,
        mensaje: 'Visitante desactivado exitosamente'
      };

    } catch (error: any) {
      console.error('Error al desactivar visitante:', error);
      return {
        exito: false,
        mensaje: 'Error al desactivar visitante',
        error: error.message
      };
    }
  }

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  obtenerTotal(): number {
    return this.visitantes().filter(v => v.activo).length;
  }

  /**
   * Obtener cantidad de visitantes activos
   */
  obtenerTotalActivos(): number {
    return this.visitantes().filter(v => v.activo).length;
  }

  /**
   * Obtener cantidad de visitantes inactivos
   */
  obtenerTotalInactivos(): number {
    return this.visitantes().filter(v => !v.activo).length;
  }

  /**
   * Limpiar caché
   */
  limpiarCache(): void {
    this.visitantes.set([]);
  }

  /**
   * Recargar datos
   */
  async recargar(): Promise<void> {
    await this.cargarTodos();
  }
}