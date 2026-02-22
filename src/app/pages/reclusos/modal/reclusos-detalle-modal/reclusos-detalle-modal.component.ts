// src/app/features/reclusos/components/recluso-detalle-modal/recluso-detalle-modal.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recluso } from '@core/models/recluso.interface';
import { SituacionLegal, EstadoRecluso } from '@core/models/enums.interface';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'prisionConnect-recluso-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent
],
  templateUrl: './reclusos-detalle-modal.component.html'
})
export class ReclusoDetalleModalComponent {
  @Input() showModal = false;
  @Input() recluso: Recluso | null = null;
  @Output() showModalChange = new EventEmitter<boolean>();

  formatearFecha(timestamp: any): string {
    if (!timestamp) return 'N/A';
    
    const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return fecha.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getSituacionBadgeClass(situacion: SituacionLegal): string {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    
    switch (situacion) {
      case SituacionLegal.CONDENADO:
        return `${baseClasses} bg-red-100 text-red-800`;
      case SituacionLegal.PROCESADO:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case SituacionLegal.PRISION_PREVENTIVA:
        return `${baseClasses} bg-orange-100 text-orange-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  getEstadoBadgeClass(estado: EstadoRecluso): string {
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';
    
    switch (estado) {
      case EstadoRecluso.ACTIVO:
        return `${baseClasses} bg-green-100 text-green-800`;
      case EstadoRecluso.LIBERTAD_CONDICIONAL:
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case EstadoRecluso.TRASLADADO:
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      case EstadoRecluso.FUGADO:
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case EstadoRecluso.FALLECIDO:
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case EstadoRecluso.LIBERADO:
        return `${baseClasses} bg-teal-100 text-teal-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
  }
}