// src/app/features/configuracion/components/areas-visita/areas-visita.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Configuracion } from '@core/models/configuracion.interface';

@Component({
  selector: 'prisionConnect-areas-visita-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './areas-visita-modal.component.html'
})
export class AreasVisitaModalComponent {
  @Input() configuracion: Configuracion | null = null;
  @Output() cambiosRealizados = new EventEmitter<void>();

  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);

  areas: string[] = [];
  nuevaArea = '';
  areaEditando: string | null = null;
  valorEditando = '';
  guardando = false;
  agregando = false;

  ngOnChanges(): void {
    if (this.configuracion) {
      this.cargarAreas();
    }
  }

  private cargarAreas(): void {
    if (!this.configuracion) return;
    this.areas = [...this.configuracion.areasVisita];
  }

  async agregarArea(): Promise<void> {
    const areaLimpia = this.nuevaArea.trim();

    if (!areaLimpia) {
      this.notificacionService.error('El nombre del área no puede estar vacío');
      return;
    }

    if (areaLimpia.length < 3) {
      this.notificacionService.error('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (areaLimpia.length > 50) {
      this.notificacionService.error('El nombre no puede exceder 50 caracteres');
      return;
    }

    this.agregando = true;

    const resultado = await this.configuracionService.agregarArea(areaLimpia);

    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.nuevaArea = '';
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.agregando = false;
  }

  iniciarEdicion(area: string): void {
    this.areaEditando = area;
    this.valorEditando = area;
  }

  cancelarEdicion(): void {
    this.areaEditando = null;
    this.valorEditando = '';
  }

  async guardarEdicion(areaAntigua: string): Promise<void> {
    const areaNueva = this.valorEditando.trim();

    if (!areaNueva) {
      this.notificacionService.error('El nombre del área no puede estar vacío');
      return;
    }

    if (areaNueva === areaAntigua) {
      this.cancelarEdicion();
      return;
    }

    if (areaNueva.length < 3) {
      this.notificacionService.error('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (areaNueva.length > 50) {
      this.notificacionService.error('El nombre no puede exceder 50 caracteres');
      return;
    }

    this.guardando = true;

    const resultado = await this.configuracionService.editarArea(areaAntigua, areaNueva);

    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.areaEditando = null;
      this.valorEditando = '';
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.guardando = false;
  }

async eliminarArea(area: string): Promise<void> {
  const confirmar = await this.notificacionService.confirmar(
    'Eliminar área',
    `¿Estás seguro de que deseas eliminar el área "${area}"?\n\nEsta acción no se puede deshacer.`,
    'Sí, eliminar',
    'Cancelar'
  );

  if (!confirmar) return;

  this.guardando = true;

  const resultado = await this.configuracionService.eliminarArea(area);

  if (resultado.success) {
    this.notificacionService.success(resultado.message);
    this.cambiosRealizados.emit();
  } else {
    this.notificacionService.error(resultado.message);
  }

  this.guardando = false;
}

  obtenerIconoArea(area: string): string {
    const iconos: Record<string, string> = {
      'sala de visitas general': '🪑',
      'sala de visitas privadas': '🚪',
      'área legal': '⚖️',
      'patio de visitas': '🌳',
      'sala de abogados': '👔'
    };

    const areaLower = area.toLowerCase();
    for (const [key, icon] of Object.entries(iconos)) {
      if (areaLower.includes(key)) return icon;
    }
    
    return '📍';
  }

  puedeEliminar(): boolean {
    return this.areas.length > 1;
  }
}