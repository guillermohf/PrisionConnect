// src/app/features/visitas/components/cambiar-estado-visita-modal/cambiar-estado-visita-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitasService } from '@core/services/visitas.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Visita } from '@core/models/visitas.interface';
import { EstadoVisita } from '@core/models/enums.interface';
import { ModalComponent } from "@shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-cambiar-estado-visita-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './cambiar-estado-visita-modal.component.html'
})
export class CambiarEstadoVisitaModalComponent {
  @Input() isOpen = false;
  @Input() visita: Visita | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() estadoCambiado = new EventEmitter<void>();

  private visitasService = inject(VisitasService);
  private notificacionService = inject(NotificacionService);

  EstadoVisita = EstadoVisita;
  procesando = false;

  estados = [
    { valor: EstadoVisita.REGISTRADA, label: 'Registrada', color: 'yellow' },
    { valor: EstadoVisita.EN_REQUISA_ENTRADA, label: 'En Requisa Entrada', color: 'blue' },
    { valor: EstadoVisita.EN_TRANSITO, label: 'En Tránsito', color: 'purple' },
    { valor: EstadoVisita.EN_CURSO, label: 'En Curso', color: 'green' },
    { valor: EstadoVisita.PENDIENTE_REQUISA_SALIDA, label: 'Pendiente Requisa Salida', color: 'orange' },
    { valor: EstadoVisita.FINALIZADA, label: 'Finalizada', color: 'gray' }
  ];

  async cambiarEstado(nuevoEstado: EstadoVisita): Promise<void> {
  if (!this.visita) return;

  const confirmar = await this.notificacionService.confirmar(
    'Cambiar estado',
    `¿Cambiar estado a "${nuevoEstado}"?`,
    'Sí, cambiar',
    'Cancelar'
  );

  if (!confirmar) return;

  this.procesando = true;

  const resultado = await this.visitasService.cambiarEstado(
    this.visita.id!,
    nuevoEstado
  );

  if (resultado.success) {
    this.notificacionService.success(resultado.message);
    this.estadoCambiado.emit();
    this.cerrar();
  } else {
    this.notificacionService.error(resultado.message);
  }

  this.procesando = false;
}


  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  obtenerColorClase(color: string): string {
    const colores: Record<string, string> = {
      'yellow': 'border-yellow-500 hover:bg-yellow-50',
      'blue': 'border-blue-500 hover:bg-blue-50',
      'purple': 'border-purple-500 hover:bg-purple-50',
      'green': 'border-green-500 hover:bg-green-50',
      'orange': 'border-orange-500 hover:bg-orange-50',
      'gray': 'border-gray-500 hover:bg-gray-50'
    };
    return colores[color] || '';
  }
}