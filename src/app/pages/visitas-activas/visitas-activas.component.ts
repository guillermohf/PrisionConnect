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
import { VisitasMonitorService } from '@core/services/visitas-monitor.service';
import { ConfiguracionService } from '@core/services/configuracion.service';

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
  private visitasMonitor = inject(VisitasMonitorService);
  private configuracionService = inject(ConfiguracionService);

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
    { key: 'visitanteNombre', label: 'VISITANTE' },
    { key: 'cedula', label: 'CEDULA' },
    { key: 'tipo', label: 'TIPO' },
    { key: 'reclusoNombre', label: 'RECLUSO' },
    { key: 'visitantesPresentes', label: 'VISITANTES' },
    { key: 'horaInicioProgramada', label: 'INICIO' },
    { key: 'horaFinProgramada', label: 'FIN' },
    { key: 'tiempoEnInstalacion', label: 'TIEMPO' },
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

  /** Tiempo que lleva el visitante en las instalaciones desde checkInPrincipal */
  calcularTiempoEnInstalacion(visita: Visita): { texto: string; vencida: boolean; porVencer: boolean } {
    // Si aún no hizo check-in, mostrar tiempo desde la hora programada
    const ahora = new Date();

    // Usar checkInPrincipal si existe, sino horaInicioProgramada
    let inicioMs: number;
    if (visita.checkInPrincipal) {
      const ci = visita.checkInPrincipal as any;
      inicioMs = (ci?.toDate ? ci.toDate() : new Date(ci)).getTime();
    } else if (visita.horaInicioProgramada) {
      const [h, m] = visita.horaInicioProgramada.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      inicioMs = d.getTime();
    } else {
      return { texto: 'N/A', vencida: false, porVencer: false };
    }

    const diffMin = Math.floor((ahora.getTime() - inicioMs) / 60_000);
    if (diffMin < 0) return { texto: 'Aún no inicia', vencida: false, porVencer: false };

    const hh = Math.floor(diffMin / 60);
    const mm = diffMin % 60;
    const texto = hh > 0 ? `${hh}h ${mm}min` : `${mm} min`;

    // Comparar con horaFinProgramada
    let vencida = false;
    let porVencer = false;
    if (visita.horaFinProgramada) {
      const [fh, fm] = visita.horaFinProgramada.split(':').map(Number);
      const finMs = new Date().setHours(fh, fm, 0, 0);
      const minutosRestantes = Math.floor((finMs - ahora.getTime()) / 60_000);
      const minutosAviso = this.configuracionService.configuracion()?.tiempoAdvertencia ?? 15;
      vencida = minutosRestantes < 0;
      porVencer = !vencida && minutosRestantes <= minutosAviso;
    }

    return { texto, vencida, porVencer };
  }

  // ── C6: Reporte de pendientes de salida ──────────────────────

  /** Visitas EN_CURSO cuya hora de fin ya pasó */
  pendientesSalidaVencidas = computed(() => {
    const ahora = new Date();
    const horaActual =
      `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    return this.visitasService.visitas().filter(
      v => v.estado === EstadoVisita.EN_CURSO &&
        v.horaFinProgramada &&
        v.horaFinProgramada <= horaActual
    );
  });

  /** Calcula cuánto tiempo llevan de exceso desde horaFin */
  tiempoVencido(horaFin: string): string {
    const [h, m] = horaFin.split(':').map(Number);
    const ahora = new Date();
    const finMs = new Date().setHours(h, m, 0, 0);
    const diff = ahora.getTime() - finMs;
    if (diff <= 0) return 'En tiempo';
    const hrs = Math.floor(diff / 3_600_000);
    const min = Math.floor((diff % 3_600_000) / 60_000);
    return hrs > 0 ? `${hrs}h ${min}min vencido` : `${min}min vencido`;
  }

  generarReportePendientes(): void {
    const pendientes = this.pendientesSalidaVencidas();
    if (pendientes.length === 0) return;
    const resumen = pendientes.map(v =>
      `• ${v.reclusoNombre} — Fin: ${v.horaFinProgramada} (${this.tiempoVencido(v.horaFinProgramada!)})`
    ).join('\n');
    this.notificacionService.warning(
      `${pendientes.length} visita(s) vencida(s):\n${resumen}`,
      'Pendientes de Salida'
    );
  }

  /** True si la visita termina en <= tiempoAdvertencia minutos */
  esPorTerminar(visita: Visita): boolean {
    if (visita.estado !== EstadoVisita.EN_CURSO || !visita.horaFinProgramada) return false;
    const minutosAviso = this.configuracionService.configuracion()?.tiempoAdvertencia ?? 15;
    return this.visitasMonitor.obtenerVisitasPorTerminar(minutosAviso)
      .some(v => v.id === visita.id);
  }
}