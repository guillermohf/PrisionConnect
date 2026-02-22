// src/app/features/visitas/components/visita-detalle-modal/visita-detalle-modal.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Visita } from '@core/models/visitas.interface';
import { EstadoVisita, TipoVisita } from '@core/models/enums.interface';
import { Timestamp } from '@angular/fire/firestore';
import { ModalComponent } from "@shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-visita-detalle-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './visita-detalle-modal.component.html'
})
export class VisitaDetalleModalComponent {
  @Input() isOpen = false;
  @Input() visita: Visita | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();

  EstadoVisita = EstadoVisita;
  TipoVisita = TipoVisita;

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : (fecha as Timestamp).toDate();
      return fechaObj.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }

  formatearHora(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : (fecha as Timestamp).toDate();
      return fechaObj.toLocaleTimeString('es-DO', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  }

  obtenerColorEstado(estado: EstadoVisita): string {
    const colores: Record<EstadoVisita, string> = {
      [EstadoVisita.REGISTRADA]: 'bg-yellow-100 text-yellow-800',
      [EstadoVisita.EN_REQUISA_ENTRADA]: 'bg-blue-100 text-blue-800',
      [EstadoVisita.RECHAZADA_EN_REQUISA]: 'bg-red-100 text-red-800',
      [EstadoVisita.EN_TRANSITO]: 'bg-purple-100 text-purple-800',
      [EstadoVisita.EN_CURSO]: 'bg-green-100 text-green-800',
      [EstadoVisita.PENDIENTE_REQUISA_SALIDA]: 'bg-orange-100 text-orange-800',
      [EstadoVisita.FINALIZADA]: 'bg-gray-100 text-gray-800',
      [EstadoVisita.CANCELADA]: 'bg-red-100 text-red-800'
    };
    return colores[estado] || '';
  }

  obtenerColorGravedad(gravedad: string): string {
    const colores: Record<string, string> = {
      'Leve': 'bg-yellow-100 text-yellow-800',
      'Moderada': 'bg-orange-100 text-orange-800',
      'Grave': 'bg-red-100 text-red-800'
    };
    return colores[gravedad] || 'bg-gray-100 text-gray-800';
  }
}