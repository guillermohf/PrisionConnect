import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Visitante } from '@core/models';
import { formatearFecha, formatearDuracion } from '@core/models';
import { ButtonComponent } from "src/app/shared/button/buttton.component";
import { ModalComponent } from "src/app/shared/modal/modal.component";

@Component({
  selector: 'prisionConnect-visitante-detalle-modal',
  imports: [
    CommonModule,
    ModalComponent
],
  templateUrl: './visitante-detalle-modal.component.html',
})
export class VisitanteDetalleModalComponent {
  // Inputs
  @Input() showModal = false;
  @Input() visitante: Visitante | null = null;

  // Outputs
  @Output() close = new EventEmitter<void>();
  @Output() editar = new EventEmitter<Visitante>();

  /**
   * Cerrar modal
   */
  closeModal(): void {
    this.close.emit();
  }

  /**
   * Emitir evento editar
   */
  editarVisitante(): void {
    if (this.visitante) {
      this.editar.emit(this.visitante);
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    return formatearFecha(fecha, 'largo');
  }

  /**
   * Obtener badge de estado
   */
  get estadoBadge(): { text: string; class: string } {
    if (this.visitante?.activo) {
      return {
        text: 'Activo',
        class: 'bg-green-100 text-green-800'
      };
    }
    return {
      text: 'Inactivo',
      class: 'bg-red-100 text-red-800'
    };
  }
}