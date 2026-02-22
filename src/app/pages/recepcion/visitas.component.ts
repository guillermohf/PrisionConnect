// src/app/features/visitas/visitas.component.ts

import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita, FiltrosVisitas } from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';
import { DataTableComponent } from '@shared/datatable/datatable.component';
import { VisitaCrearModalComponent } from './modal/visita-crear-modal/visita-crear-modal.component';
import { VisitaDetalleModalComponent } from './modal/visita-detalle-modal/visita-detalle-modal.component';
import { CheckInModalComponent } from './modal/check-in-modal/check-in-modal.component';
import { CheckOutModalComponent } from './modal/check-out-modal/check-out-modal.component';
import { CambiarEstadoVisitaModalComponent } from './modal/cambiar-estado-visita-modal/cambiar-estado-visita-modal.component';
import { AgregarIncidenciaModalComponent } from './modal/agregar-incidencia-modal/agregar-incidencia-modal.component';

@Component({
  selector: 'prisionConnect-visitas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    VisitaCrearModalComponent,
    VisitaDetalleModalComponent,
    CheckInModalComponent,
    CheckOutModalComponent,
    CambiarEstadoVisitaModalComponent,
    AgregarIncidenciaModalComponent
  ],
  templateUrl: './visitas.component.html'
})
export default class VisitasComponent implements OnInit {
  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  // =========================
  // SIGNALS
  // =========================
  loading = this.visitasService.loading;
  estadisticas = this.visitasService.estadisticas;
  
  filtros = signal<FiltrosVisitas>({});

  // =========================
  // COMPUTED
  // =========================
  visitasFiltradas = computed(() => {
    return this.visitasService.obtenerVisitasFiltradas(this.filtros());
  });

  // =========================
  // MODALES
  // =========================
  mostrarModalCrear = false;
  mostrarModalDetalle = false;
  mostrarModalCheckIn = false;
  mostrarModalCheckOut = false;
  mostrarModalCambiarEstado = false;
  mostrarModalIncidencia = false;

  visitaSeleccionada: Visita | null = null;

  // =========================
  // COLUMNAS TABLA
  // =========================
  columnas = [
    { key: 'tipo', label: 'TIPO' },
    { key: 'reclusoNombre', label: 'RECLUSO' },
    { key: 'fechaVisita', label: 'FECHA' },
    { key: 'horaInicioProgramada', label: 'HORA' },
    { key: 'estado', label: 'ESTADO' },
    { key: 'areaVisita', label: 'ÁREA' }
  ];

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.visitasService.cargarVisitas();
  }

  // =========================
  // FILTROS
  // =========================
  actualizarFiltro(campo: keyof FiltrosVisitas, valor: any): void {
    this.filtros.update(f => ({ ...f, [campo]: valor }));
  }

  limpiarFiltros(): void {
    this.filtros.set({});
  }

  // Métodos auxiliares para fechas
  obtenerFechaInputInicio(): string {
    const fecha = this.filtros().fechaInicio;
    return fecha ? this.formatearFechaInput(fecha) : '';
  }

  obtenerFechaInputFin(): string {
    const fecha = this.filtros().fechaFin;
    return fecha ? this.formatearFechaInput(fecha) : '';
  }

  actualizarFechaInicio(valor: string): void {
    this.actualizarFiltro('fechaInicio', valor ? new Date(valor) : undefined);
  }

  actualizarFechaFin(valor: string): void {
    this.actualizarFiltro('fechaFin', valor ? new Date(valor) : undefined);
  }

  // =========================
  // ACCIONES DE VISITA
  // =========================
  verDetalle(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalDetalle = true;
  }

  abrirCheckIn(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalCheckIn = true;
  }

  abrirCheckOut(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalCheckOut = true;
  }

  abrirCambiarEstado(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalCambiarEstado = true;
  }

  abrirIncidencia(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalIncidencia = true;
  }

  async cancelarVisita(visita: Visita): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      'Cancelar visita',
      `¿Estás seguro de que deseas cancelar esta visita?\n\n` +
      `Recluso: ${visita.reclusoNombre}\n` +
      `Fecha: ${this.formatearFecha(visita.fechaVisita)}`,
      'Sí, cancelar',
      'No'
    );

    if (!confirmar) return;

    const motivo = await this.notificacionService.textarea(
      'Motivo de cancelación',
      'Escribe el motivo de la cancelación...'
    );

    if (!motivo || !motivo.trim()) {
      await this.notificacionService.warning(
        'Debes ingresar un motivo para cancelar la visita',
        'Motivo requerido'
      );
      return;
    }

    this.notificacionService.loading('Cancelando visita...');

    const resultado = await this.visitasService.cancelarVisita(
      visita.id!,
      motivo
    );

    this.notificacionService.cerrarLoading();

    if (resultado.success) {
      this.notificacionService.toast('Visita cancelada exitosamente', 'success');
    } else {
      await this.notificacionService.error(resultado.message);
    }
  }

  // =========================
  // CALLBACKS DE MODALES
  // =========================
  onVisitaCreada(): void {
    this.notificacionService.toast('Visita creada exitosamente', 'success');
  }

  onEstadoCambiado(): void {
    this.notificacionService.toast('Estado actualizado', 'success');
  }

  onCheckInRealizado(): void {
    this.notificacionService.toast('Check-in realizado', 'success');
  }

  onCheckOutRealizado(): void {
    this.notificacionService.toast('Check-out realizado', 'success');
  }

  onIncidenciaAgregada(): void {
    this.notificacionService.toast('Incidencia registrada', 'success');
  }

  // =========================
  // UTILIDADES
  // =========================
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

  formatearFechaInput(fecha: Date): string {
    if (!fecha) return '';
    try {
      const fechaObj = fecha instanceof Date ? fecha : (fecha as any).toDate();
      const year = fechaObj.getFullYear();
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const day = String(fechaObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  }

  obtenerColorEstado(estado: EstadoVisita): string {
    return this.visitasService.obtenerColorEstado(estado);
  }

  puedeHacerCheckIn(visita: Visita): boolean {
    return visita.estado === EstadoVisita.EN_CURSO;
  }

  puedeHacerCheckOut(visita: Visita): boolean {
    return visita.estado === EstadoVisita.EN_CURSO &&
      (visita.visitantesPresentes > 0);
  }

  puedeCancelar(visita: Visita): boolean {
    return visita.estado === EstadoVisita.REGISTRADA ||
      visita.estado === EstadoVisita.EN_REQUISA_ENTRADA;
  }

  trackById(index: number, visita: Visita): string | number {
    return visita.id ?? index;
  }
}