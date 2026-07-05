// src/app/core/services/visitas-monitor.service.ts

import { Injectable, inject, OnDestroy } from '@angular/core';
import { VisitasService } from './visitas.service';
import { EstadoVisita } from '@core/models/enums.interface';

/**
 * C5 — Monitor automático de visitas.
 * Revisa cada 60s las visitas EN_CURSO con hora vencida
 * y las pasa automáticamente a PENDIENTE_REQUISA_SALIDA.
 */
@Injectable({ providedIn: 'root' })
export class VisitasMonitorService implements OnDestroy {
  private visitasService = inject(VisitasService);
  private timer: ReturnType<typeof setInterval> | null = null;

  /** Inicia el monitor (llamar desde el layout principal) */
  start(): void {
    if (this.timer) return; // Ya corriendo
    this.timer = setInterval(() => this.revisarVencidas(), 60_000);
    // Ejecutar inmediatamente al iniciar
    this.revisarVencidas();
  }

  /** Detiene el monitor */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async revisarVencidas(): Promise<void> {
    const ahora = new Date();
    const horaActual =
      `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    const vencidas = this.visitasService.visitas().filter(
      v => v.estado === EstadoVisita.EN_CURSO &&
        v.horaFinProgramada &&
        v.horaFinProgramada <= horaActual
    );

    for (const v of vencidas) {
      if (!v.id) continue;
      await this.visitasService.cambiarEstado(
        v.id,
        EstadoVisita.PENDIENTE_REQUISA_SALIDA
      );
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
