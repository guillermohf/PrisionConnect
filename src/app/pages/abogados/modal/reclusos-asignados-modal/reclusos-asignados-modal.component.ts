// src/app/features/abogados/components/reclusos-asignados/reclusos-asignados.component.ts

import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelacionesAbogadosService, RelacionAbogado } from '@core/services/relaciones-abogados.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Abogado } from '@core/models/abogado.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from '@shared/button/buttton.component';
import { AsignarReclusoModalComponent } from '../asignar-recluso-modal/asignar-recluso-modal.component';

@Component({
  selector: 'prisionConnect-reclusos-asignados-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent,
    ButtonComponent,
    AsignarReclusoModalComponent
],
  templateUrl: './reclusos-asignados-modal.component.html'
})
export class ReclusosAsignadosComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() abogado: Abogado | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();

  private relacionesService = inject(RelacionesAbogadosService);
  private notificacionService = inject(NotificacionService);

  reclusosAsignados: RelacionAbogado[] = [];
  loading = false;
  mostrarModalAsignar = false;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['abogado'] || changes['isOpen']) && this.abogado && this.isOpen) {
      this.cargarReclusos();
    }
  }

  async cargarReclusos(): Promise<void> {
    if (!this.abogado?.id) return;

    this.loading = true;
    try {
      this.reclusosAsignados = await this.relacionesService.obtenerReclusosDeAbogado(this.abogado.id);
    } catch (error) {
      console.error('Error cargando reclusos:', error);
      this.notificacionService.error('Error al cargar reclusos asignados');
    } finally {
      this.loading = false;
    }
  }

  // ⭐ MODIFICADO: Cerrar modal principal al abrir modal de asignar
  abrirModalAsignar(): void {
    this.cerrar(); // Cerrar este modal primero
    setTimeout(() => {
      this.mostrarModalAsignar = true; // Abrir modal de asignar
    }, 100);
  }

  // ⭐ MODIFICADO: Reabrir modal principal después de asignar
  async onReclusoAsignado(): Promise<void> {
    await this.cargarReclusos();
    setTimeout(() => {
      this.isOpen = true; // Reabrir este modal
      this.isOpenChange.emit(true);
    }, 100);
  }

  async desasignar(relacion: RelacionAbogado): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      'Desasignar Abogado',
      `¿Estás seguro de que deseas desasignar el recluso ${relacion.reclusoNombre}?`,
      'Sí, desasignar',
      'Cancelar'
    );

    if (!confirmar || !relacion.id) return;

    const resultado = await this.relacionesService.desasignarAbogado(relacion.id);
    
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      await this.cargarReclusos();
    } else {
      this.notificacionService.error(resultado.message);
    }
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    try {
      const fechaObj = fecha.toDate ? fecha.toDate() : new Date(fecha);
      return fechaObj.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  estaVencida(fechaVencimiento: any): boolean {
    if (!fechaVencimiento) return false;
    
    try {
      const fechaVenc = fechaVencimiento.toDate ? fechaVencimiento.toDate() : new Date(fechaVencimiento);
      return fechaVenc < new Date();
    } catch (error) {
      return false;
    }
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }
}