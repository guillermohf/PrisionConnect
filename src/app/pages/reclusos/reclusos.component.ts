// src/app/features/reclusos/reclusos.component.ts

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReclusosService } from '@core/services/reclusos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Recluso, FiltrosReclusos } from '@core/models/recluso.interface';
import { SituacionLegal, EstadoRecluso } from '@core/models/enums.interface';
import { DataTableComponent } from '@shared/datatable/datatable.component';
import { ReclusoAgregarModalComponent } from './modal/reclusos-agregar-modal/reclusos-agregar-modal.component';
import { ReclusoEditarModalComponent } from './modal/reclusos-editar-modal/reclusos-editar-modal.component';
import { ReclusoDetalleModalComponent } from './modal/reclusos-detalle-modal/reclusos-detalle-modal.component';
import { AutorizarVisitanteModalComponent } from "./modal/autorizar-visitante-modal/autorizar-visitante-modal.component";

@Component({
  selector: 'prisionConnect-reclusos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    ReclusoAgregarModalComponent,
    ReclusoEditarModalComponent,
    ReclusoDetalleModalComponent,
    AutorizarVisitanteModalComponent
  ],
  templateUrl: './reclusos.component.html'
})
export default class ReclusosComponent implements OnInit {
  private reclusosService = inject(ReclusosService);
  private notificacionService = inject(NotificacionService);

  // Enums para el template
  SituacionLegal = SituacionLegal;
  EstadoRecluso = EstadoRecluso;

  // Signals del servicio
  reclusos = this.reclusosService.reclusos;
  loading = this.reclusosService.loading;

  // Estadísticas (COMPUTED)
  estadisticas = computed(() => {
    const lista = this.reclusos().filter(r => r.activo);
    return {
      total: lista.length,
      activos: lista.filter(r => r.estado === EstadoRecluso.ACTIVO).length,
      procesados: lista.filter(r => r.situacionLegal === SituacionLegal.PROCESADO).length,
      condenados: lista.filter(r => r.situacionLegal === SituacionLegal.CONDENADO).length,
      hombres: lista.filter(r => r.sexo === 'Masculino').length,
      mujeres: lista.filter(r => r.sexo === 'Femenino').length
    };
  });
  // Filtros (SIGNAL)
  filtros = signal<FiltrosReclusos>({
    busqueda: '',
    situacionLegal: undefined,
    estado: undefined,
    sexo: undefined,
    activo: true
  });

  // Reclusos filtrados (COMPUTED - se actualiza automáticamente)
  reclusosFiltrados = computed<Recluso[]>(() => {
    return this.reclusosService.obtenerReclusosFiltrados(this.filtros());
  });

  // Modales
  mostrarModalAgregar = signal(false);
  mostrarModalEditar = signal(false);
  mostrarModalDetalle = signal(false);
  mostrarModalVisitantes = signal(false);
  reclusoSeleccionado = signal<Recluso | null>(null);

  // Columnas de la tabla
  columnas = [
    { key: 'numeroIdentificacion', label: 'No. Identificación' },
    { key: 'nombreCompleto', label: 'Nombre Completo' },
    { key: 'cedula', label: 'Cédula' },
    { key: 'situacionLegal', label: 'Situación Legal' },
    { key: 'estado', label: 'Estado' },
    { key: 'pabellon', label: 'Pabellón' },
    { key: 'celda', label: 'Celda' }
  ];

  ngOnInit(): void {
    // No se necesita aplicarFiltros() - el computed lo hace automáticamente
  }

  // ========================
  // Filtros
  // ========================
  actualizarFiltro<K extends keyof FiltrosReclusos>(
    key: K,
    value: FiltrosReclusos[K]
  ): void {
    this.filtros.update(f => ({
      ...f,
      [key]: value
    }));
  }

  limpiarFiltros(): void {
    this.filtros.set({
      busqueda: '',
      situacionLegal: undefined,
      estado: undefined,
      sexo: undefined,
      activo: true
    });
  }

  // ========================
  // Acciones
  // ========================
  abrirModalAgregar(): void {
    this.mostrarModalAgregar.set(true);
  }

  verVisitantesAutorizados(recluso: Recluso): void {
    this.reclusoSeleccionado.set(recluso);
    this.mostrarModalVisitantes.set(true);
  }

  verDetalle(recluso: Recluso): void {
    this.reclusoSeleccionado.set(recluso);
    this.mostrarModalDetalle.set(true);
  }

  editarRecluso(recluso: Recluso): void {
    this.reclusoSeleccionado.set(recluso);
    this.mostrarModalEditar.set(true);
  }

  async confirmarEliminar(recluso: Recluso): Promise<void> {
    if (!recluso.id) return;

    const confirmar = await this.notificacionService.confirmarEliminacion(
      `al recluso ${recluso.nombreCompleto}`
    );

    if (!confirmar) return;

    const resultado = await this.reclusosService.eliminarRecluso(recluso.id);

    if (resultado.success) {
      await this.notificacionService.success(resultado.message);
      // No necesitamos aplicarFiltros() - los signals se actualizan solos
    } else {
      await this.notificacionService.error(resultado.message);
    }
  }

  // ========================
  // Utilidades
  // ========================
  calcularEdad(fechaNacimiento: any): number {
    if (!fechaNacimiento) return 0;
    
    try {
      const fecha = fechaNacimiento instanceof Date 
        ? fechaNacimiento 
        : fechaNacimiento.toDate();
      
      const hoy = new Date();
      let edad = hoy.getFullYear() - fecha.getFullYear();
      const mes = hoy.getMonth() - fecha.getMonth();
      
      if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
        edad--;
      }
      
      return edad;
    } catch (error) {
      return 0;
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaObj.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  obtenerColorEstado(estado: EstadoRecluso | undefined): string {
    if (!estado) {
      return 'bg-gray-100 text-gray-800 border-gray-300';
    }

    const colores: Record<EstadoRecluso, string> = {
      [EstadoRecluso.ACTIVO]: 'bg-green-100 text-green-800 border-green-300',
      [EstadoRecluso.LIBERTAD_CONDICIONAL]: 'bg-blue-100 text-blue-800 border-blue-300',
      [EstadoRecluso.TRASLADADO]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      [EstadoRecluso.FUGADO]: 'bg-red-100 text-red-800 border-red-300',
      [EstadoRecluso.FALLECIDO]: 'bg-gray-100 text-gray-800 border-gray-300',
      [EstadoRecluso.LIBERADO]: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    
    return colores[estado] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  // ========================
  // Callbacks de modales
  // ========================
  onReclusoAgregado(): void {
    this.notificacionService.success('Recluso registrado exitosamente');
    // No necesitamos aplicarFiltros() - los signals se actualizan solos
  }

  onReclusoActualizado(): void {
    this.notificacionService.success('Recluso actualizado exitosamente');
    // No necesitamos aplicarFiltros() - los signals se actualizan solos
  }
}