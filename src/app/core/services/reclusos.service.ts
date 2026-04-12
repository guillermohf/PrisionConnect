import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  onSnapshot
} from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth'; // ✅ IMPORTANTE: Importar Auth de Firebase
import { Recluso, FiltrosReclusos, CrearReclusoDTO, ActualizarReclusoDTO } from '@core/models/recluso.interface';
import { AuthService } from './auth.service';
import { calcularEdad, getNombreCompleto } from '@core/models/utils';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReclusosService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private auth = inject(Auth); // ✅ Inyectamos Auth
  private reclusosCollection = collection(this.firestore, 'reclusos');

  // Signals reactivos
  reclusos = signal<Recluso[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  // ✅ Guardamos la conexión para poder cerrarla al cerrar sesión
  private listenerUnsubscribe: (() => void) | null = null;

  constructor() {
    // ⭐ SOLUCIÓN: Esperar a tener un usuario válido antes de consultar Firestore
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.escucharReclusos();
      } else {
        this.detenerEscucha();
        this.reclusos.set([]); // Limpiamos la memoria al cerrar sesión
      }
    });
  }

  /**
   * ESCUCHA EN TIEMPO REAL
   */
  private escucharReclusos(): void {
    // Si ya estamos escuchando, no abrimos otra conexión
    if (this.listenerUnsubscribe) return;

    this.loading.set(true);
    const q = query(this.reclusosCollection, orderBy('fechaCreacion', 'desc'));

    // Asignamos el resultado a nuestra variable para poder desconectarlo después
    this.listenerUnsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const docs = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Recluso));
        this.reclusos.set(docs);
        this.loading.set(false);
        this.error.set(null);
      },
      error: (err) => {
        console.error('❌ Error en listener de reclusos:', err);
        this.error.set('Error de permisos o conexión');
        this.loading.set(false);
      }
    });
  }

  /**
   * DETENER ESCUCHA (Para evitar fugas de memoria o errores al hacer logout)
   */
  private detenerEscucha(): void {
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }
  }

  /**
   * OBTENER FILTRADOS
   */
  obtenerReclusosFiltrados(filtros: FiltrosReclusos): Recluso[] {
    let resultado = this.reclusos();

    if (filtros.situacionLegal) resultado = resultado.filter(r => r.situacionLegal === filtros.situacionLegal);
    if (filtros.estado) resultado = resultado.filter(r => r.estado === filtros.estado);
    if (filtros.pabellon) resultado = resultado.filter(r => r.pabellon === filtros.pabellon);
    if (filtros.sexo) resultado = resultado.filter(r => r.sexo === filtros.sexo);
    if (filtros.activo !== undefined) resultado = resultado.filter(r => r.activo === filtros.activo);

    if (filtros.busqueda) {
      const b = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(r =>
        r.nombreCompleto.toLowerCase().includes(b) ||
        r.numeroIdentificacion.includes(b) ||
        (r.cedula && r.cedula.includes(b))
      );
    }
    return resultado;
  }

  /**
   * AGREGAR RECLUSO
   */
  async agregarRecluso(datos: CrearReclusoDTO): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      this.loading.set(true);
      const edad = calcularEdad(datos.fechaNacimiento);
      const fechaSalida = datos.sentencia ? this.calcularFechaSalida(datos.fechaIngreso, datos.sentencia) : null;

      const nuevo = {
        ...datos,
        nombreCompleto: getNombreCompleto(datos.nombre, datos.apellido),
        edad,
        fechaEstimadaSalida: fechaSalida,
        activo: true,
        estadisticas: { totalVisitantes: 0, totalAbogados: 0, totalVisitas: 0, ultimaVisita: null },
        fechaCreacion: Timestamp.now(),
        fechaActualizacion: Timestamp.now(),
        creadoPor: this.authService.userId() || 'sistema'
      };

      const docRef = await addDoc(this.reclusosCollection, nuevo);
      return { success: true, message: 'Recluso registrado', id: docRef.id };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * ACTUALIZAR RECLUSO
   */
  async actualizarRecluso(id: string, datos: ActualizarReclusoDTO): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);
      const reclusoRef = doc(this.firestore, `reclusos/${id}`);
      const actual = this.reclusos().find(r => r.id === id);

      // Construir el body de actualización dinamicamente
      const updateBody: any = {
        ...datos,
        modificadoPor: this.authService.userId() || 'sistema',
        fechaActualizacion: Timestamp.now()
      };

      if (datos.fechaNacimiento) updateBody.edad = calcularEdad(datos.fechaNacimiento);
      
      const payloadNombre = (datos as any).nombre;
      const payloadApellido = (datos as any).apellido;
      
      if (payloadNombre || payloadApellido) {
        updateBody.nombreCompleto = getNombreCompleto(payloadNombre || actual?.nombre, payloadApellido || actual?.apellido);
      }

      await updateDoc(reclusoRef, updateBody);
      return { success: true, message: 'Actualizado correctamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * ELIMINAR (Soft Delete)
   */
  async eliminarRecluso(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const reclusoRef = doc(this.firestore, `reclusos/${id}`);
      await updateDoc(reclusoRef, { 
        activo: false, 
        modificadoPor: this.authService.userId() || 'sistema',
        fechaActualizacion: Timestamp.now() 
      });
      return { success: true, message: 'Eliminado correctamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * ESTADÍSTICAS
   */
  obtenerEstadisticas(): any {
    const r = this.reclusos();
    const stats: any = {
      total: r.length,
      porEstado: {},
      porSituacionLegal: {},
      masculinos: r.filter(x => x.sexo === 'Masculino').length,
      femeninos: r.filter(x => x.sexo === 'Femenino').length,
      porPabellon: {}
    };

    r.forEach(x => {
      stats.porSituacionLegal[x.situacionLegal] = (stats.porSituacionLegal[x.situacionLegal] || 0) + 1;
      if (x.estado) stats.porEstado[x.estado] = (stats.porEstado[x.estado] || 0) + 1;
      stats.porPabellon[x.pabellon] = (stats.porPabellon[x.pabellon] || 0) + 1;
    });

    return stats;
  }

  /**
   * CALCULAR FECHA DE SALIDA
   */
  private calcularFechaSalida(fechaIngreso: any, sentencia: number): Timestamp {
    const ingreso = fechaIngreso instanceof Timestamp ? fechaIngreso.toDate() : new Date(fechaIngreso);
    const salida = new Date(ingreso);
    salida.setFullYear(salida.getFullYear() + sentencia);
    return Timestamp.fromDate(salida);
  }

  /**
   * OBTENER TODOS
   */
  obtenerTodos(): Observable<Recluso[]> {
    return of(this.reclusos().filter(r => r.activo));
  }

  /**
   * REPORTE
   */
  obtenerReporte(filtros: any): Observable<any[]> {
    let filtrados = this.reclusos();
    
    if (filtros.fechaInicio && filtros.fechaFin) {
      const inicio = new Date(`${filtros.fechaInicio}T00:00:00`);
      const fin = new Date(`${filtros.fechaFin}T23:59:59`);
      filtrados = filtrados.filter(r => {
        const fecha = r.fechaIngreso instanceof Timestamp ? r.fechaIngreso.toDate() : new Date(r.fechaIngreso);
        return fecha >= inicio && fecha <= fin;
      });
    }

    if (filtros.tipoDelito) {
      const td = filtros.tipoDelito.toLowerCase().trim();
      filtrados = filtrados.filter(r => r.delito?.toLowerCase().includes(td));
    }

    if (filtros.estadoRecluso) {
      filtrados = filtrados.filter(r => r.estado === filtros.estadoRecluso);
    }
    
    const datos = filtrados.map(r => ({
      numeroInterno: r.numeroIdentificacion || r.numeroExpediente || 'N/A',
      nombreCompleto: r.nombreCompleto,
      delito: r.delito || 'N/A',
      tiempoCondena: r.sentencia ? `${r.sentencia} años` : 'N/A',
      estado: r.estado || 'N/A'
    }));
    return of(datos);
  }
}