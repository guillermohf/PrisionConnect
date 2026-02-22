// src/app/features/usuarios/components/cambiar-estado-modal/cambiar-estado-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService } from '@core/services/usuarios.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Usuario } from '@core/models/usuario.interface';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'prisionConnect-cambiar-estado-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent
],
  templateUrl: './cambiar-estado-modal.component.html'
})
export class CambiarEstadoModalComponent {
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() estadoCambiado = new EventEmitter<void>();

  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);

  guardando = false;

  async cambiarEstado(nuevoEstado: boolean): Promise<void> {
    if (!this.usuario?.id) return;

    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const confirmar = confirm(
      `¿Estás seguro de que deseas ${accion} a ${this.usuario.nombreCompleto}?`
    );

    if (!confirmar) return;

    this.guardando = true;

    try {
      const resultado = await this.usuariosService.cambiarEstado({
        usuarioId: this.usuario.id,
        activo: nuevoEstado
      });

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.estadoCambiado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al cambiar estado');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  obtenerNombreRol(): string {
    return this.usuario ? this.usuariosService.obtenerNombreRol(this.usuario.rol) : '';
  }

  obtenerColorRol(): string {
    return this.usuario ? this.usuariosService.obtenerColorRol(this.usuario.rol) : '';
  }
}