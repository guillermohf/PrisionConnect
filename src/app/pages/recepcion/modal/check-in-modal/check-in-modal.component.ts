// src/app/features/visitas/components/check-in-modal/check-in-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita, CheckInVisitanteDTO } from '@core/models/visitas.interface';
import { ModalComponent } from "@shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-check-in-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './check-in-modal.component.html'
})
export class CheckInModalComponent {
  @Input() isOpen = false;
  @Input() visita: Visita | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() checkInRealizado = new EventEmitter<void>();

  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  procesando = false;

  async realizarCheckIn(visitanteId: string): Promise<void> {
    if (!this.visita) return;

    this.procesando = true;

    const dto: CheckInVisitanteDTO = {
      visitaId: this.visita.id!,
      visitanteId
    };

    const resultado = await this.visitasService.checkInVisitante(dto);

    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.checkInRealizado.emit();
      
      // Recargar visita
      const visitaActualizada = this.visitasService.visitas().find(v => v.id === this.visita!.id);
      if (visitaActualizada) {
        this.visita = visitaActualizada;
      }
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.procesando = false;
  }

  puedeHacerCheckIn(visitante: any): boolean {
    return !visitante.checkIn;
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  formatearHora(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaObj.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }
}