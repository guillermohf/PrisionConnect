// src/app/pages/visitas-activas/visitas-activas.component.ts

import { Component, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita } from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';
import { DataTableComponent } from '@shared/datatable/datatable.component';
import { VisitaDetalleModalComponent } from '../recepcion/modal/visita-detalle-modal/visita-detalle-modal.component';
import { CheckOutModalComponent } from '../recepcion/modal/check-out-modal/check-out-modal.component';
import { CheckInModalComponent } from '../recepcion/modal/check-in-modal/check-in-modal.component';
import { CambiarEstadoVisitaModalComponent } from '../recepcion/modal/cambiar-estado-visita-modal/cambiar-estado-visita-modal.component';
import { AgregarIncidenciaModalComponent } from '../recepcion/modal/agregar-incidencia-modal/agregar-incidencia-modal.component';

@Component({
  selector: 'prisionConnect-visitas-activas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DataTableComponent,
    VisitaDetalleModalComponent,
    CheckInModalComponent,
    CheckOutModalComponent,
    CambiarEstadoVisitaModalComponent,
    AgregarIncidenciaModalComponent
  ],
  templateUrl: './visitas-activas.component.html'
})
export default class VisitasActivasComponent implements OnInit {
  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  loading = this.visitasService.loading;
  estadisticas = this.visitasService.estadisticas;

  // Visitas activas (en curso y en tránsito)
  visitasActivas = computed(() =>
    this.visitasService.visitas().filter(v =>
      v.estado === EstadoVisita.EN_CURSO ||
      v.estado === EstadoVisita.EN_TRANSITO ||
      v.estado === EstadoVisita.EN_REQUISA_ENTRADA ||
      v.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA
    )
  );

  // Contadores por estado
  visitasEnTransito = computed(() =>
    this.visitasActivas().filter(v => v.estado === EstadoVisita.EN_TRANSITO).length
  );

  visitasPendienteSalida = computed(() =>
    this.visitasActivas().filter(v => v.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA).length
  );

  // Filtro de vista (SIGNAL)
  vistaActual = signal<'todas' | 'en-curso' | 'en-transito'>('todas');

  // Visitas filtradas (COMPUTED - se actualiza automáticamente)
  visitasFiltradas = computed(() => {
    const visitas = this.visitasActivas();

    switch (this.vistaActual()) {
      case 'en-curso':
        return visitas.filter(v => v.estado === EstadoVisita.EN_CURSO);
      case 'en-transito':
        return visitas.filter(v =>
          v.estado === EstadoVisita.EN_TRANSITO ||
          v.estado === EstadoVisita.EN_REQUISA_ENTRADA
        );
      default:
        return visitas;
    }
  });

  // Modales
  mostrarModalDetalle = false;
  mostrarModalCheckIn = false;
  mostrarModalCheckOut = false;
  mostrarModalCambiarEstado = false;
  mostrarModalIncidencia = false;
  visitaSeleccionada: Visita | null = null;

  // Columnas para la tabla
  columnas: ColumnaConfig[] = [
    {
      key: 'cedula',
      label: 'CEDULA',
      getValue: (row: any) => row.tipo === TipoVisita.LEGAL
        ? row.abogado?.cedula
        : row.visitantes?.[0]?.cedula
    },
    { key: 'tipo', label: 'TIPO' },
    { key: 'reclusoNombre', label: 'RECLUSO' },
    { key: 'totalVisitantes', label: 'CANT. VISITANTES' },
    { key: 'fechaVisita', label: 'FECHA' },
    { key: 'horaInicioProgramada', label: 'HORA' },
    { key: 'estado', label: 'ESTADO' },
    { key: 'areaVisita', label: 'ÁREA' }
  ];

  ngOnInit(): void {
    this.visitasService.cargarVisitas();
  }

  cambiarVista(vista: 'todas' | 'en-curso' | 'en-transito'): void {
    this.vistaActual.set(vista);
    // El computed visitasFiltradas se actualiza automáticamente
  }

  // Acciones de visita
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

  // Callbacks
  onCheckInRealizado(): void {
    this.notificacionService.success('Check-in realizado');
    // No necesitamos aplicarFiltro() - los signals se actualizan solos
  }

  onCheckOutRealizado(): void {
    this.notificacionService.success('Check-out realizado');
  }

  onEstadoCambiado(): void {
    this.notificacionService.success('Estado actualizado');
  }

  onIncidenciaAgregada(): void {
    this.notificacionService.success('Incidencia registrada');
  }

  // Utilidades
  puedeHacerCheckIn(visita: Visita): boolean {
    return visita.estado === EstadoVisita.REGISTRADA ||
      visita.estado === EstadoVisita.EN_REQUISA_ENTRADA;
  }

  puedeHacerCheckOut(visita: Visita): boolean {
    return visita.estado === EstadoVisita.EN_CURSO &&
      visita.visitantesPresentes > 0;
  }

  obtenerColorEstado(estado: EstadoVisita): string {
    return this.visitasService.obtenerColorEstado(estado);
  }

  formatearHora(hora: string): string {
    return hora || 'N/A';
  }

  calcularTiempoTranscurrido(visita: Visita): string {
    if (!visita.horaInicioProgramada) return 'N/A';

    const ahora = new Date();
    const [horas, minutos] = visita.horaInicioProgramada.split(':').map(Number);
    const horaInicio = new Date();
    horaInicio.setHours(horas, minutos, 0);

    const diff = Math.floor((ahora.getTime() - horaInicio.getTime()) / 60000);

    if (diff < 0) return 'Aún no inicia';
    if (diff < 60) return `${diff} min`;

    const hh = Math.floor(diff / 60);
    const mm = diff % 60;
    return `${hh}h ${mm}min`;
  }
}