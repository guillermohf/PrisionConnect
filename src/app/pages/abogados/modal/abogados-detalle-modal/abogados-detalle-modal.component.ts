// src/app/features/abogados/components/abogado-detalle-modal/abogado-detalle-modal.component.ts

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Abogado } from '@core/models/abogado.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from "@shared/button/buttton.component";

@Component({
  selector: 'prisionConnect-abogado-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent
],
  templateUrl: './abogados-detalle-modal.component.html'
})
export class AbogadoDetalleModalComponent {
  @Input() isOpen = false;
  @Input() abogado: Abogado | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  
  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return fechaObj.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  obtenerClaseEstado(activo: boolean): string {
    return activo 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  obtenerTextoEstado(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
  }
}