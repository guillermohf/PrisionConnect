// src/app/features/visitas/components/check-out-modal/check-out-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita, CheckOutVisitanteDTO } from '@core/models/visitas.interface';
import { ModalComponent } from "@shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-check-out-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './check-out-modal.component.html'
})
export class CheckOutModalComponent {
  @Input() isOpen = false;
  @Input() visita: Visita | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() checkOutRealizado = new EventEmitter<void>();

  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  procesando = false;
  observaciones: Record<string, string> = {};

  async realizarCheckOut(visitanteId: string): Promise<void> {
    if (!this.visita) return;

    this.procesando = true;

    const dto: CheckOutVisitanteDTO = {
      visitaId: this.visita.id!,
      visitanteId,
      observaciones: this.observaciones[visitanteId]
    };

    const resultado = await this.visitasService.checkOutVisitante(dto);

    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.checkOutRealizado.emit();
      
      const visitaActualizada = this.visitasService.visitas().find(v => v.id === this.visita!.id);
      if (visitaActualizada) {
        this.visita = visitaActualizada;
      }
      
      delete this.observaciones[visitanteId];
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.procesando = false;
  }

  puedeHacerCheckOut(visitante: any): boolean {
    return visitante.checkIn && !visitante.checkOut;
  }

  todosSinPendienteCheckout(): boolean {
    if (!this.visita || !this.visita.visitantes) return true;
    return this.visita.visitantes.every(v => !this.puedeHacerCheckOut(v));
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.observaciones = {};
  }

  formatearHora(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaObj.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
    } catch { return 'N/A'; }
  }
}