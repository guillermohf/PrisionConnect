import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';

@Component({
  selector: 'prisionConnect-pabellones-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pabellones-modal.component.html'
})
export class PabellonesModalComponent {
  @Output() cambiosRealizados = new EventEmitter<void>();

  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);

  get pabellones(): string[] {
    return this.configuracionService.configuracion()?.pabellones ?? [];
  }

  nuevoPabellon = '';
  pabellonEditando: string | null = null;
  valorEditando = '';
  guardando = false;
  agregando = false;

  async agregarPabellon(): Promise<void> {
    const nombre = this.nuevoPabellon.trim();
    if (!nombre) {
      this.notificacionService.error('El nombre no puede estar vacío');
      return;
    }
    this.agregando = true;
    const resultado = await this.configuracionService.agregarPabellon(nombre);
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.nuevoPabellon = '';
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }
    this.agregando = false;
  }

  iniciarEdicion(pabellon: string): void {
    this.pabellonEditando = pabellon;
    this.valorEditando = pabellon;
  }

  cancelarEdicion(): void {
    this.pabellonEditando = null;
    this.valorEditando = '';
  }

  async guardarEdicion(antiguo: string): Promise<void> {
    const nuevo = this.valorEditando.trim();
    if (!nuevo) {
      this.notificacionService.error('El nombre no puede estar vacío');
      return;
    }
    if (nuevo === antiguo) { this.cancelarEdicion(); return; }

    this.guardando = true;
    const resultado = await this.configuracionService.editarPabellon(antiguo, nuevo);
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.pabellonEditando = null;
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }
    this.guardando = false;
  }

  async eliminarPabellon(pabellon: string): Promise<void> {
    const confirmar = await this.notificacionService.confirmar(
      'Eliminar pabellón',
      `¿Eliminar el pabellón "${pabellon}"? Esta acción no se puede deshacer.`,
      'Sí, eliminar',
      'Cancelar'
    );
    if (!confirmar) return;

    this.guardando = true;
    const resultado = await this.configuracionService.eliminarPabellon(pabellon);
    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }
    this.guardando = false;
  }

  puedeEliminar(): boolean {
    return this.pabellones.length > 1;
  }
}
