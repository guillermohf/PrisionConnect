// src/app/core/services/visitas.service.ts

import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  Timestamp,
  serverTimestamp
} from '@angular/fire/firestore';
import {
  Visita,
  CrearVisitaDTO,
  CheckInVisitanteDTO,
  CheckOutVisitanteDTO,
  AgregarIncidenciaDTO,
  FiltrosVisitas
} from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisitasService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  visitas = signal<Visita[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  estadisticas = computed(() => {
    const todasVisitas = this.visitas();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const visitasHoy = todasVisitas.filter(v => {
      const fecha = v.fechaVisita instanceof Timestamp ? v.fechaVisita.toDate() : new Date(v.fechaVisita);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getTime() === hoy.getTime();
    });

    return {
      visitasHoy: visitasHoy.length,
      visitasActivas: todasVisitas.filter(v => v.estado === EstadoVisita.EN_CURSO).length,
      visitantesDentro: visitasHoy.reduce((sum, v) => sum + (v.visitantesPresentes || 0), 0),
      registradas: todasVisitas.filter(v => v.estado === EstadoVisita.REGISTRADA).length,
      enRequisa: todasVisitas.filter(v => v.estado === EstadoVisita.EN_REQUISA_ENTRADA).length,
      enCurso: todasVisitas.filter(v => v.estado === EstadoVisita.EN_CURSO).length,
      pendientesSalida: todasVisitas.filter(v => v.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA).length,
      finalizadasHoy: visitasHoy.filter(v => v.estado === EstadoVisita.FINALIZADA).length,
      familiares: todasVisitas.filter(v => v.tipo === TipoVisita.FAMILIAR).length,
      legales: todasVisitas.filter(v => v.tipo === TipoVisita.LEGAL).length,
      amistades: todasVisitas.filter(v => v.tipo === TipoVisita.AMISTADES).length,      
      duracionPromedio: this.calcularDuracionPromedio(visitasHoy.filter(v => v.duracionVisitaReal)),
      reclusosConVisitaHoy: new Set(visitasHoy.map(v => v.reclusoId)).size,
      incidenciasHoy: visitasHoy.reduce((sum, v) => sum + (v.incidencias?.length || 0), 0)
    };
  });

  async cargarVisitas(): Promise<void> {
    this.loading.set(true);
    try {
      const visitasRef = collection(this.firestore, 'visitas');
      const q = query(visitasRef, orderBy('fechaVisita', 'desc'));
      const snapshot = await getDocs(q);
      
      const visitas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Visita));
      
      this.visitas.set(visitas);
      this.error.set(null);
    } catch (error: any) {
      console.error('Error cargando visitas:', error);
      this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async crearVisita(dto: CrearVisitaDTO): Promise<{ success: boolean; message: string; visitaId?: string }> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return { success: false, message: 'No hay usuario autenticado' };
      }

      const reclusoDoc = await getDoc(doc(this.firestore, 'reclusos', dto.reclusoId));
      if (!reclusoDoc.exists()) {
        return { success: false, message: 'Recluso no encontrado' };
      }

      const reclusoData = reclusoDoc.data();
      const visitantes: any[] = [];
      let abogado = null;

      if (dto.tipo === TipoVisita.FAMILIAR && dto.visitantes) {
        for (const visitanteId of dto.visitantes) {
          const relDoc = await getDoc(
            doc(this.firestore, 'relacionesVisitantes', `${dto.reclusoId}_${visitanteId}`)
          );
          if (relDoc.exists()) {
            const rel = relDoc.data();
            visitantes.push({
              visitanteId: rel['visitanteId'],
              nombre: rel['visitanteNombre'],
              cedula: rel['visitanteCedula'] || '',
              parentesco: rel['parentesco'],
              checkIn: null,
              checkOut: null,
              presente: false,
              observaciones: ''
            });
          }
        }
      }

      if (dto.tipo === TipoVisita.LEGAL && dto.abogadoId) {
        const relDoc = await getDoc(
          doc(this.firestore, 'relacionesAbogados', `${dto.reclusoId}_${dto.abogadoId}`)
        );
        if (relDoc.exists()) {
          const rel = relDoc.data();
          abogado = {
            abogadoId: rel['abogadoId'],
            nombre: rel['abogadoNombre'],
            exequatur: rel['abogadoExequatur']
          };
        }
      }

      const nuevaVisita = {
        tipo: dto.tipo,
        reclusoId: dto.reclusoId,
        reclusoNombre: reclusoData['nombreCompleto'],
        reclusoPabellon: reclusoData['pabellon'],
        reclusoCelda: reclusoData['celda'],
        visitantes: dto.tipo === TipoVisita.FAMILIAR ? visitantes : [],
        totalVisitantes: visitantes.length,
        visitantesPresentes: 0,
        abogado: dto.tipo === TipoVisita.LEGAL ? abogado : null,
        fechaVisita: Timestamp.fromDate(dto.fechaVisita),
        horaInicioProgramada: dto.horaInicioProgramada,
        horaFinProgramada: dto.horaFinProgramada,
        checkInPrincipal: null,
        checkOutFinal: null,
        duracionTotal: 0,
        duracionVisitaReal: null,
        estado: EstadoVisita.REGISTRADA,
        areaVisita: dto.areaVisita,
        mesaNumero: null,
        usuarioRecepcionId: currentUser.uid,
        usuarioRecepcionNombre: currentUser.displayName || currentUser.email,
        usuarioRequisaId: null,
        usuarioRequisaNombre: null,
        observaciones: dto.observaciones || '',
        incidencias: [],
        tiempos: {
          registro: serverTimestamp(),
          inicioRequisaEntrada: null,
          finRequisaEntrada: null,
          ingresoArea: null,
          salidaArea: null,
          inicioRequisaSalida: null,
          finRequisaSalida: null,
          finalizacion: null
        },
        fechaCreacion: serverTimestamp(),
        fechaActualizacion: serverTimestamp(),
        creadoPor: currentUser.uid
      };

      const docRef = await addDoc(collection(this.firestore, 'visitas'), nuevaVisita);
      await this.cargarVisitas();

      return { success: true, message: 'Visita creada exitosamente', visitaId: docRef.id };
    } catch (error: any) {
      console.error('Error creando visita:', error);
      return { success: false, message: error.message || 'Error al crear la visita' };
    }
  }

  async checkInVisitante(dto: CheckInVisitanteDTO): Promise<{ success: boolean; message: string }> {
    try {
      const visitaRef = doc(this.firestore, 'visitas', dto.visitaId);
      const visitaDoc = await getDoc(visitaRef);
      
      if (!visitaDoc.exists()) {
        return { success: false, message: 'Visita no encontrada' };
      }

      const visita = visitaDoc.data() as Visita;
      const visitantes = [...visita.visitantes];
      const index = visitantes.findIndex(v => v.visitanteId === dto.visitanteId);

      if (index === -1) {
        return { success: false, message: 'Visitante no encontrado' };
      }

      visitantes[index] = {
        ...visitantes[index],
        checkIn: Timestamp.now(),
        presente: true
      };

      const visitantesPresentes = visitantes.filter(v => v.presente).length;
      const checkInPrincipal = visita.checkInPrincipal || Timestamp.now();

      await updateDoc(visitaRef, {
        visitantes,
        visitantesPresentes,
        checkInPrincipal,
        fechaActualizacion: serverTimestamp()
      });

      await this.cargarVisitas();
      return { success: true, message: 'Check-in realizado exitosamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async checkOutVisitante(dto: CheckOutVisitanteDTO): Promise<{ success: boolean; message: string }> {
    try {
      const visitaRef = doc(this.firestore, 'visitas', dto.visitaId);
      const visitaDoc = await getDoc(visitaRef);
      
      if (!visitaDoc.exists()) {
        return { success: false, message: 'Visita no encontrada' };
      }

      const visita = visitaDoc.data() as Visita;
      const visitantes = [...visita.visitantes];
      const index = visitantes.findIndex(v => v.visitanteId === dto.visitanteId);

      if (index === -1) {
        return { success: false, message: 'Visitante no encontrado' };
      }

      visitantes[index] = {
        ...visitantes[index],
        checkOut: Timestamp.now(),
        observaciones: dto.observaciones || ''
      };

      const todosHanSalido = visitantes.filter(v => v.presente).every(v => v.checkOut);
      const checkOutFinal = todosHanSalido ? Timestamp.now() : visita.checkOutFinal;

      await updateDoc(visitaRef, {
        visitantes,
        checkOutFinal,
        fechaActualizacion: serverTimestamp()
      });

      await this.cargarVisitas();
      return { success: true, message: 'Check-out realizado exitosamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async cambiarEstado(visitaId: string, nuevoEstado: EstadoVisita): Promise<{ success: boolean; message: string }> {
    try {
      const visitaRef = doc(this.firestore, 'visitas', visitaId);
      const updates: any = {
        estado: nuevoEstado,
        fechaActualizacion: serverTimestamp()
      };

      if (nuevoEstado === EstadoVisita.EN_REQUISA_ENTRADA) {
        updates['tiempos.inicioRequisaEntrada'] = serverTimestamp();
      } else if (nuevoEstado === EstadoVisita.EN_TRANSITO) {
        updates['tiempos.finRequisaEntrada'] = serverTimestamp();
      } else if (nuevoEstado === EstadoVisita.EN_CURSO) {
        updates['tiempos.ingresoArea'] = serverTimestamp();
      } else if (nuevoEstado === EstadoVisita.PENDIENTE_REQUISA_SALIDA) {
        updates['tiempos.salidaArea'] = serverTimestamp();
      } else if (nuevoEstado === EstadoVisita.FINALIZADA) {
        updates['tiempos.finalizacion'] = serverTimestamp();
      }

      await updateDoc(visitaRef, updates);
      await this.cargarVisitas();
      return { success: true, message: 'Estado actualizado exitosamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async agregarIncidencia(dto: AgregarIncidenciaDTO): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = this.auth.currentUser;
      if (!currentUser) {
        return { success: false, message: 'No hay usuario autenticado' };
      }

      const visitaRef = doc(this.firestore, 'visitas', dto.visitaId);
      const visitaDoc = await getDoc(visitaRef);
      
      if (!visitaDoc.exists()) {
        return { success: false, message: 'Visita no encontrada' };
      }

      const visita = visitaDoc.data() as Visita;
      const incidencias = [...(visita.incidencias || [])];

      incidencias.push({
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        gravedad: dto.gravedad,
        fecha: Timestamp.now(),
        usuarioReporte: currentUser.displayName || currentUser.email || 'Usuario'
      });

      await updateDoc(visitaRef, {
        incidencias,
        fechaActualizacion: serverTimestamp()
      });

      await this.cargarVisitas();
      return { success: true, message: 'Incidencia agregada exitosamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async cancelarVisita(visitaId: string, motivo: string): Promise<{ success: boolean; message: string }> {
    try {
      const visitaRef = doc(this.firestore, 'visitas', visitaId);
      await updateDoc(visitaRef, {
        estado: EstadoVisita.CANCELADA,
        observaciones: motivo,
        fechaActualizacion: serverTimestamp()
      });

      await this.cargarVisitas();
      return { success: true, message: 'Visita cancelada exitosamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  obtenerVisitasFiltradas(filtros: FiltrosVisitas): Visita[] {
    let visitas = this.visitas();

    if (filtros.estado) {
      visitas = visitas.filter(v => v.estado === filtros.estado);
    }

    if (filtros.tipo) {
      visitas = visitas.filter(v => v.tipo === filtros.tipo);
    }

    if (filtros.reclusoId) {
      visitas = visitas.filter(v => v.reclusoId === filtros.reclusoId);
    }

    if (filtros.fechaInicio) {
      visitas = visitas.filter(v => {
        const fecha = v.fechaVisita instanceof Timestamp ? v.fechaVisita.toDate() : new Date(v.fechaVisita);
        return fecha >= new Date(filtros.fechaInicio!);
      });
    }

    if (filtros.fechaFin) {
      visitas = visitas.filter(v => {
        const fecha = v.fechaVisita instanceof Timestamp ? v.fechaVisita.toDate() : new Date(v.fechaVisita);
        return fecha <= new Date(filtros.fechaFin!);
      });
    }

    return visitas;
  }

  obtenerColorEstado(estado: EstadoVisita): string {
    const colores: Record<EstadoVisita, string> = {
      [EstadoVisita.REGISTRADA]: 'bg-yellow-100 text-yellow-800',
      [EstadoVisita.EN_REQUISA_ENTRADA]: 'bg-blue-100 text-blue-800',
      [EstadoVisita.RECHAZADA_EN_REQUISA]: 'bg-red-100 text-red-800',
      [EstadoVisita.EN_TRANSITO]: 'bg-purple-100 text-purple-800',
      [EstadoVisita.EN_CURSO]: 'bg-green-100 text-green-800',
      [EstadoVisita.PENDIENTE_REQUISA_SALIDA]: 'bg-orange-100 text-orange-800',
      [EstadoVisita.FINALIZADA]: 'bg-gray-100 text-gray-800',
      [EstadoVisita.CANCELADA]: 'bg-red-100 text-red-800'
    };
    return colores[estado] || '';
  }

  private calcularDuracionPromedio(visitas: Visita[]): number {
    if (visitas.length === 0) return 0;
    const total = visitas.reduce((sum, v) => sum + (v.duracionVisitaReal || 0), 0);
    return Math.round(total / visitas.length);
  }
  
  obtenerReporte(filtros: any): Observable<any[]> {
    return new Observable(observer => {
      try {
        let visitasFiltradas = this.visitas();

        if (filtros.fechaInicio && filtros.fechaFin) {
          const inicio = new Date(filtros.fechaInicio);
          const fin = new Date(filtros.fechaFin);
          fin.setHours(23, 59, 59, 999);

          visitasFiltradas = visitasFiltradas.filter(v => {
            const fecha = v.fechaVisita instanceof Timestamp 
              ? v.fechaVisita.toDate() 
              : new Date(v.fechaVisita);
            return fecha >= inicio && fecha <= fin;
          });
        }

        if (filtros.tipoVisita) {
          visitasFiltradas = visitasFiltradas.filter(v => v.tipo === filtros.tipoVisita);
        }

        if (filtros.estado) {
          visitasFiltradas = visitasFiltradas.filter(v => v.estado === filtros.estado);
        }

        const datos = visitasFiltradas.map(v => ({
          fecha: v.fechaVisita instanceof Timestamp 
            ? this.formatearFecha(v.fechaVisita.toDate()) 
            : this.formatearFecha(new Date(v.fechaVisita)),
          visitante: this.obtenerNombresVisitantes(v),
          recluso: v.reclusoNombre || 'N/A',
          tipo: v.tipo,
          estado: v.estado,
          duracion: v.duracionVisitaReal ? `${v.duracionVisitaReal} min` : '0 min'
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

  private obtenerNombresVisitantes(visita: Visita): string {
    if (visita.tipo === TipoVisita.LEGAL && visita.abogado) {
      return visita.abogado.nombre || 'Abogado';
    }
    
    if (visita.tipo === TipoVisita.FAMILIAR && visita.visitantes && visita.visitantes.length > 0) {
      if (visita.visitantes.length === 1) {
        return visita.visitantes[0].nombre;
      }
      return `${visita.visitantes[0].nombre} +${visita.visitantes.length - 1}`;
    }
    
    return 'N/A';
  }
}