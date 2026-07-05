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
    CommonModule, FormsModule, DataTableComponent,
    VisitaCrearModalComponent, VisitaDetalleModalComponent,
    CheckInModalComponent, CheckOutModalComponent,
    CambiarEstadoVisitaModalComponent, AgregarIncidenciaModalComponent
  ],
  templateUrl: './visitas.component.html'
})
export default class VisitasComponent implements OnInit {
  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  loading = this.visitasService.loading;
  estadisticas = this.visitasService.estadisticas;
  filtros = signal<FiltrosVisitas>({});

  visitasFiltradas = computed(() => {
    const todas = this.visitasService.obtenerVisitasFiltradas(this.filtros());
    const hoyTimestamp = new Date().setHours(0, 0, 0, 0);

    return todas.filter(visita => {
      // 1. Si la visita está activa, se muestra SIEMPRE (incluso si la fecha está mal guardada o si pasó de medianoche)
      const estadosActivos = [
        EstadoVisita.REGISTRADA,
        EstadoVisita.EN_REQUISA_ENTRADA,
        EstadoVisita.EN_TRANSITO,
        EstadoVisita.EN_CURSO,
        EstadoVisita.PENDIENTE_REQUISA_SALIDA
      ];

      if (estadosActivos.includes(visita.estado)) {
        return true;
      }

      // 2. Si no es activa, solo la mostramos si es de HOY
      if (!visita.fechaVisita) return false;

      let fechaProcesada: Date;

      if (visita.fechaVisita instanceof Date) {
        fechaProcesada = new Date(visita.fechaVisita);
      } else if (typeof (visita.fechaVisita as any).toDate === 'function') {
        fechaProcesada = (visita.fechaVisita as any).toDate();
      } else if ((visita.fechaVisita as any).seconds !== undefined) {
        fechaProcesada = new Date((visita.fechaVisita as any).seconds * 1000);
      } else {
        const strFecha = String(visita.fechaVisita);
        const matchT = strFecha.match(/Timestamp\(seconds=(\d+)/);

        if (matchT) {
          fechaProcesada = new Date(parseInt(matchT[1]) * 1000);
        } else if (strFecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = strFecha.split('-');
          fechaProcesada = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else {
          fechaProcesada = new Date(visita.fechaVisita as any);
        }
      }

      return fechaProcesada.setHours(0, 0, 0, 0) === hoyTimestamp;
    });
  });
  // Control de Modales
  mostrarModalCrear = false;
  mostrarModalDetalle = false;
  mostrarModalCheckIn = false;
  mostrarModalCheckOut = false;
  mostrarModalCambiarEstado = false;
  mostrarModalIncidencia = false;

  visitaSeleccionada: Visita | null = null;

  columnas: ColumnaConfig[] = [
    { key: 'visitanteNombre', label: 'VISITANTE' },
    { key: 'cedula', label: 'CEDULA' },
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

  formatearFecha(fecha: any): string {
    if (!fecha) return '---';

    try {
      let fechaObj: Date;

      // 1. Si ya es un objeto Date
      if (fecha instanceof Date) {
        fechaObj = fecha;
      }
      // 2. Si es un Timestamp de Firebase (tiene el método toDate)
      else if (typeof fecha.toDate === 'function') {
        fechaObj = fecha.toDate();
      }
      // 3. Si es un objeto con segundos (Firestore plano)
      else if (fecha.seconds !== undefined) {
        fechaObj = new Date(fecha.seconds * 1000);
      }
      // 4. Si es un String como "YYYY-MM-DD" o de otro tipo
      else {
        const strFecha = String(fecha);
        const matchT = strFecha.match(/Timestamp\(seconds=(\d+)/);

        if (matchT) {
          fechaObj = new Date(parseInt(matchT[1]) * 1000);
        }
        // Si el formato es exactamente YYYY-MM-DD evitamos el offset UTC
        else if (strFecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = strFecha.split('-');
          fechaObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        } else {
          fechaObj = new Date(fecha);
        }
      }

      // Validar si la conversión fue exitosa
      if (isNaN(fechaObj.getTime())) {
        return fecha.toString();
      }

      const d = String(fechaObj.getDate()).padStart(2, '0');
      const m = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const y = fechaObj.getFullYear();

      return `${d}/${m}/${y}`;
    } catch (error) {
      return 'Error de fecha';
    }
  }

  /**
   * Lógica para mostrar acciones (Se añadió 'En Tránsito' para coincidir con tu captura)
   */
  puedeHacerCheckIn(visita: Visita): boolean {
    if (!visita.estado) return false;

    // Convertimos a minúsculas para evitar errores de "Registrada" vs "REGISTRADA"
    const estadoActual = visita.estado.toString().toLowerCase();

    const estadosValidos = [
      EstadoVisita.REGISTRADA.toLowerCase(),
      EstadoVisita.EN_REQUISA_ENTRADA.toLowerCase(),
      'en tránsito',
      'registrada'
    ];

    return estadosValidos.includes(estadoActual);
  }

  puedeHacerCheckOut(visitante: any): boolean {
    // Solo muestra si tiene entrada (checkIn) y no tiene salida (!checkOut)
    return visitante.checkIn && !visitante.checkOut;
  }

  puedeCancelar(visita: Visita): boolean {
    return [EstadoVisita.REGISTRADA, EstadoVisita.EN_REQUISA_ENTRADA].includes(visita.estado as any);
  }

  // Métodos de acción
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
    const confirmar = await this.notificacionService.confirmar('Cancelar Visita', '¿Desea cancelar esta visita?', 'Sí', 'No');
    if (!confirmar) return;

    const motivo = await this.notificacionService.textarea('Motivo de Cancelación', 'Escriba por qué se cancela...');
    if (!motivo) return;

    this.notificacionService.loading('Cancelando...');
    const res = await this.visitasService.cancelarVisita(visita.id!, motivo);
    this.notificacionService.cerrarLoading();

    if (res.success) this.notificacionService.toast('Visita cancelada', 'success');
  }

  // Ayudantes de UI
  actualizarFiltro(campo: keyof FiltrosVisitas, valor: any): void {
    this.filtros.update(f => ({ ...f, [campo]: valor }));
  }

  limpiarFiltros(): void { this.filtros.set({}); }

  obtenerColorEstado(estado: any) { return this.visitasService.obtenerColorEstado(estado); }

  trackById(index: number, v: Visita) { return v.id ?? index; }


  // Callbacks de modales
  onVisitaCreada() { this.mostrarModalCrear = false; }
  onCheckInRealizado() { this.mostrarModalCheckIn = false; }
  onCheckOutRealizado() { this.mostrarModalCheckOut = false; }
  onEstadoCambiado(): void {
    this.mostrarModalCambiarEstado = false;
    this.notificacionService.toast('Estado actualizado correctamente', 'success');
  }

  onIncidenciaAgregada(): void {
    this.mostrarModalIncidencia = false;
    this.notificacionService.toast('Incidencia registrada en el sistema', 'info');
  }
}