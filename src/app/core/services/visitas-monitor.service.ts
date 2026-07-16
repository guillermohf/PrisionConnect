// src/app/core/services/visitas-monitor.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { VisitasService } from './visitas.service';
import { ConfiguracionService } from './configuracion.service';
import { NotificacionService } from './notificacion.service';
import { EstadoVisita } from '@core/models/enums.interface';
import { Visita } from '@core/models/visitas.interface';
import Swal from 'sweetalert2';

/**
 * Monitor automático de visitas.
 * - Cada 60s mueve a PENDIENTE_REQUISA_SALIDA las visitas EN_CURSO vencidas.
 * - Dispara Swal fijo (sin timer) cuando alguna visita está por terminar
 *   según tiempoAdvertencia de la configuración (default 15 min).
 */
@Injectable({ providedIn: 'root' })
export class VisitasMonitorService {
  private visitasService = inject(VisitasService);
  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);

  private timer: ReturnType<typeof setInterval> | null = null;

  /** IDs de visitas ya alertadas en esta sesión (evita repetir el swal) */
  private alertadasIds = new Set<string>();

  /** Inicia el monitor (llamar desde el layout principal) */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.revisar(), 60_000);
    this.revisar();
  }

  /** Detiene el monitor */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async revisar(): Promise<void> {
    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    const minutosAviso = this.configuracionService.configuracion()?.tiempoAdvertencia ?? 15;

    // 1️⃣ Mover vencidas a PENDIENTE_REQUISA_SALIDA
    const vencidas = this.visitasService.visitas().filter(
      v => v.estado === EstadoVisita.EN_CURSO &&
        v.horaFinProgramada &&
        v.horaFinProgramada <= horaActual
    );
    for (const v of vencidas) {
      if (!v.id) continue;
      await this.visitasService.cambiarEstado(v.id, EstadoVisita.PENDIENTE_REQUISA_SALIDA);
    }

    // 2️⃣ Detectar visitas EN_CURSO que terminarán en ≤ minutosAviso minutos
    const porTerminar = this.obtenerVisitasPorTerminar(minutosAviso);
    const noAlertadas = porTerminar.filter(v => v.id && !this.alertadasIds.has(v.id!));

    if (noAlertadas.length > 0) {
      noAlertadas.forEach(v => this.alertadasIds.add(v.id!));
      this.mostrarAlertaPorTerminar(noAlertadas, minutosAviso);
    }
  }

  /** Retorna visitas EN_CURSO con horaFin dentro de los próximos N minutos */
  obtenerVisitasPorTerminar(minutosAviso: number): Visita[] {
    const ahora = new Date();
    const ahoraMins = ahora.getHours() * 60 + ahora.getMinutes();

    return this.visitasService.visitas().filter(v => {
      if (v.estado !== EstadoVisita.EN_CURSO || !v.horaFinProgramada) return false;
      const [h, m] = v.horaFinProgramada.split(':').map(Number);
      const finMins = h * 60 + m;
      const diff = finMins - ahoraMins;
      return diff > 0 && diff <= minutosAviso;
    });
  }

  private mostrarAlertaPorTerminar(visitas: Visita[], minutosAviso: number): void {
    const lista = visitas.map(v =>
      `<li class="py-1 border-b border-orange-100 last:border-0">
        <span class="font-semibold">${v.reclusoNombre}</span>
        <span class="text-orange-700 ml-2">— Fin: ${v.horaFinProgramada}</span>
        <span class="text-xs text-gray-500 ml-1">(Visitante: ${v.visitantes?.[0]?.nombre ?? 'N/A'})</span>
      </li>`
    ).join('');

    Swal.fire({
      icon: 'warning',
      title: `⏰ ${visitas.length} visita${visitas.length > 1 ? 's' : ''} por terminar`,
      html: `
        <p class="text-sm text-gray-600 mb-3">
          Las siguientes visitas finalizan en menos de <strong>${minutosAviso} minutos</strong>:
        </p>
        <ul class="text-left text-sm max-h-48 overflow-y-auto border border-orange-200 rounded-lg p-3 bg-orange-50">
          ${lista}
        </ul>
        <p class="text-xs text-gray-500 mt-3">Prepara el proceso de requisa de salida.</p>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d97706',
      allowOutsideClick: false,  // No cierra al hacer clic fuera (fijo)
      allowEscapeKey: false,     // No cierra con ESC
      showCancelButton: false,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-orange-800'
      }
    });
  }
}
