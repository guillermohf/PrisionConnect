import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { PabellonConfig } from '@core/models/configuracion.interface';

@Component({
  selector: 'prisionConnect-pabellones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pabellones-modal.component.html'
})
export class PabellonesModalComponent {
  @Output() cambiosRealizados = new EventEmitter<void>();

  private configuracionService = inject(ConfiguracionService);
  private notificacionService  = inject(NotificacionService);

  guardando = false;
  agregando = false;

  // ── Formulario de nuevo pabellón ─────────────────────────────
  nuevo: PabellonConfig = { nombre: '', celdaInicio: 1, celdaFin: 100, capacidadPorCelda: 2 };

  // ── Edición inline ───────────────────────────────────────────
  editandoNombre: string | null = null;
  edicion: PabellonConfig = { nombre: '', celdaInicio: 1, celdaFin: 100, capacidadPorCelda: 2 };

  // ── Getter reactivo ──────────────────────────────────────────
  get pabellonesConfig(): PabellonConfig[] {
    const cfg = this.configuracionService.configuracion();
    // Si existen en pabellonesConfig los usa; sino convierte el string[] legacy
    if (cfg?.pabellonesConfig?.length) return cfg.pabellonesConfig;
    return (cfg?.pabellones ?? []).map(nombre => ({
      nombre,
      celdaInicio: 1,
      celdaFin: 30,
      capacidadPorCelda: 2
    }));
  }

  // ── Métricas ─────────────────────────────────────────────────
  get totalCeldas(): number {
    return this.pabellonesConfig.reduce(
      (acc, p) => acc + (p.celdaFin - p.celdaInicio + 1), 0
    );
  }

  get capacidadTotal(): number {
    return this.pabellonesConfig.reduce(
      (acc, p) => acc + (p.celdaFin - p.celdaInicio + 1) * p.capacidadPorCelda, 0
    );
  }

  // ── Agregar ──────────────────────────────────────────────────
  async agregarPabellon(): Promise<void> {
    this.agregando = true;
    const resultado = await this.configuracionService.agregarPabellonConfig({ ...this.nuevo });
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.nuevo = { nombre: '', celdaInicio: 1, celdaFin: 100, capacidadPorCelda: 2 };
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }
    this.agregando = false;
  }

  // ── Edición ──────────────────────────────────────────────────
  iniciarEdicion(p: PabellonConfig): void {
    this.editandoNombre = p.nombre;
    this.edicion = { ...p };
  }

  cancelarEdicion(): void {
    this.editandoNombre = null;
  }

  async guardarEdicion(): Promise<void> {
    if (!this.editandoNombre) return;
    this.guardando = true;
    const resultado = await this.configuracionService.actualizarPabellonConfig(
      this.editandoNombre, { ...this.edicion }
    );
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.editandoNombre = null;
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }
    this.guardando = false;
  }

  // ── Eliminar ─────────────────────────────────────────────────
  async eliminarPabellon(nombre: string): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      'Eliminar pabellón',
      `¿Eliminar el pabellón "${nombre}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmar) return;
    this.guardando = true;
    const resultado = await this.configuracionService.eliminarPabellon(nombre);
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }
    this.guardando = false;
  }

  puedeEliminar(): boolean {
    return this.pabellonesConfig.length > 1;
  }

  /** Genera el texto del rango: "01 — 100 (100 celdas)" */
  rangoCeldas(p: PabellonConfig): string {
    const cant = p.celdaFin - p.celdaInicio + 1;
    return `${String(p.celdaInicio).padStart(2, '0')} – ${String(p.celdaFin).padStart(2, '0')}  (${cant} celdas)`;
  }

  /** Capacidad total del pabellón */
  capacidadPabellon(p: PabellonConfig): number {
    return (p.celdaFin - p.celdaInicio + 1) * p.capacidadPorCelda;
  }
}
