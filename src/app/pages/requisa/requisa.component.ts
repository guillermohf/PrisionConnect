// src/app/pages/requisa/requisa.component.ts
// 🎨 BRANDING: #006666, #008080, #1A2626

import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita } from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';

import { AgregarIncidenciaModalComponent } from "../recepcion/modal/agregar-incidencia-modal/agregar-incidencia-modal.component";
import { CambiarEstadoVisitaModalComponent } from "../recepcion/modal/cambiar-estado-visita-modal/cambiar-estado-visita-modal.component";
import { VisitaDetalleModalComponent } from "../recepcion/modal/visita-detalle-modal/visita-detalle-modal.component";
import { DataTableComponent } from "@shared/datatable/datatable.component";

@Component({
  selector: 'prisionConnect-requisa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgClass,
    AgregarIncidenciaModalComponent,
    CambiarEstadoVisitaModalComponent,
    VisitaDetalleModalComponent,
    DataTableComponent
],
  templateUrl: './requisa.component.html'
})
export default class RequisaComponent implements OnInit {

  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  loading = this.visitasService.loading;

  // =========================
  // TIPO DE REQUISA
  // =========================
tipoRequisa = signal<'entrada' | 'salida'>('entrada');

  // =========================
  // DATA
  // =========================
  visitasPendientesEntrada = computed(() =>
    this.visitasService.visitas().filter(v =>
      v.estado === EstadoVisita.REGISTRADA ||
      v.estado === EstadoVisita.EN_REQUISA_ENTRADA
    )
  );

  visitasPendientesSalida = computed(() =>
    this.visitasService.visitas().filter(v =>
      v.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA
    )
  );

visitasFiltradas = computed(() => {
  return this.tipoRequisa() === 'entrada'
    ? this.visitasPendientesEntrada()
    : this.visitasPendientesSalida();
});

  // =========================
  // MODALES
  // =========================
  mostrarModalDetalle = false;
  mostrarModalCambiarEstado = false;
  mostrarModalIncidencia = false;
  visitaSeleccionada: Visita | null = null;

  // =========================
  // COLUMNAS TABLA
  // =========================
  columnasEntrada = [
    { key: 'reclusoNombre', label: 'RECLUSO' },
    { key: 'tipo', label: 'TIPO' },
    { key: 'totalVisitantes', label: 'VISITANTES' },
    { key: 'horaInicioProgramada', label: 'HORA PROGRAMADA' },
    { key: 'areaVisita', label: 'ÁREA' },
    { key: 'estado', label: 'ESTADO' }
  ];

  columnasSalida = [
    { key: 'id', label: 'ID', hidden: true },
    { key: 'reclusoNombre', label: 'RECLUSO' },
    { key: 'tipo', label: 'TIPO' },
    { key: 'visitantesPresentes', label: 'VISITANTES' },
    { key: 'duracionVisitaReal', label: 'DURACIÓN (min)' },
    { key: 'areaVisita', label: 'ÁREA' }
  ];

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.cambiarTipoRequisa('entrada');
  }

  cambiarTipoRequisa(tipo: 'entrada' | 'salida'): void {
    this.tipoRequisa.set(tipo);
  }


  // =========================
  // ACCIONES
  // =========================
  verDetalle(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalDetalle = true;
  }

  abrirCambiarEstado(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalCambiarEstado = true;
  }

  abrirIncidencia(visita: Visita): void {
    this.visitaSeleccionada = visita;
    this.mostrarModalIncidencia = true;
  }

  async aprobarRequisa(visita: Visita): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      '¿Aprobar requisa?',
      `¿Está seguro de aprobar la requisa de ${this.tipoRequisa()} para ${visita.reclusoNombre}?`,
      //                                              ↑↑ Signal llamado correctamente
      'Sí, aprobar',
      'Cancelar'
    );
    if (!confirmar) return;

    const nuevoEstado =
      this.tipoRequisa() === 'entrada'
        ? EstadoVisita.EN_TRANSITO
        : EstadoVisita.FINALIZADA;

    const resultado = await this.visitasService.cambiarEstado(
      visita.id!,
      nuevoEstado
    );

    if (resultado.success) {
      this.notificacionService.success(`Requisa de ${this.tipoRequisa()} aprobada`);
      this.cambiarTipoRequisa(this.tipoRequisa());
    } else {
      this.notificacionService.error(resultado.message);
    }
  }

  async rechazarRequisa(visita: Visita): Promise<void> {
    const motivo = await this.notificacionService.textarea(
        'Rechazar Requisa',
        'Ingrese el motivo del rechazo...'
      );
  
    if (!motivo) return;

    const resultado = await this.visitasService.cancelarVisita(visita.id!, motivo);

    if (resultado.success) {
      this.notificacionService.success('Visita cancelada por requisa');
      this.cambiarTipoRequisa(this.tipoRequisa());
    } else {
      this.notificacionService.error(resultado.message);
    }
  }

  // =========================
  // CALLBACKS MODALES
  // =========================
  onEstadoCambiado(): void {
    this.cambiarTipoRequisa(this.tipoRequisa());
    this.notificacionService.success('Estado actualizado');
  }

  onIncidenciaAgregada(): void {
    this.cambiarTipoRequisa(this.tipoRequisa());
    this.notificacionService.success('Incidencia registrada');
  }

  // =========================
  // UTILIDADES (YA EXISTÍAN)
  // =========================
  obtenerColorEstado(estado: EstadoVisita): string {
    return this.visitasService.obtenerColorEstado(estado);
  }

  calcularTiempoEspera(visita: Visita): string {
    if (!visita.horaInicioProgramada) return 'N/A';

    const ahora = new Date();
    const [h, m] = visita.horaInicioProgramada.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, 0);

    const diff = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);

    if (diff < 0) return `Falta ${Math.abs(diff)} min`;
    if (diff < 60) return `${diff} min esperando`;

    return `${Math.floor(diff / 60)}h ${diff % 60}min esperando`;
  }

  obtenerPrioridad(visita: Visita): 'alta' | 'media' | 'baja' {
    if (!visita.horaInicioProgramada) return 'baja';

    const ahora = new Date();
    const [h, m] = visita.horaInicioProgramada.split(':').map(Number);
    const inicio = new Date();
    inicio.setHours(h, m, 0);

    const diff = Math.floor((ahora.getTime() - inicio.getTime()) / 60000);

    if (diff > 30) return 'alta';
    if (diff > 15) return 'media';
    return 'baja';
  }

  obtenerColorPrioridad(prioridad: 'alta' | 'media' | 'baja'): string {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-300';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  }

  // ✅ NECESARIO PARA CARDS (ANTES FALTABA)
  trackById(index: number, visita: Visita): string | number {
    return visita.id ?? index;
  }
}
