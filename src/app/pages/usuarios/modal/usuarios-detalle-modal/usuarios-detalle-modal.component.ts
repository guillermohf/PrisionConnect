// src/app/features/usuarios/components/usuario-detalle-modal/usuario-detalle-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Usuario } from '@core/models/usuario.interface';
import { UsuariosService } from '@core/services/usuarios.service';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'prisionConnect-usuarios-detalle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ModalComponent
],
  templateUrl: './usuarios-detalle-modal.component.html'
})
export class UsuarioDetalleModalComponent {
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();

  private usuariosService = inject(UsuariosService);

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'Nunca';
    
    try {
      const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaObj.toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

  obtenerNombreRol(): string {
    return this.usuario ? this.usuariosService.obtenerNombreRol(this.usuario.rol) : '';
  }

  obtenerColorRol(): string {
    return this.usuario ? this.usuariosService.obtenerColorRol(this.usuario.rol) : '';
  }

  obtenerClaseEstado(): string {
    return this.usuario?.activo 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  obtenerTextoEstado(): string {
    return this.usuario?.activo ? 'Activo' : 'Inactivo';
  }

  obtenerIconoProvider(): string {
    if (!this.usuario) return '';
    return this.usuario.provider === 'google' ? '🔵' : '📧';
  }

  obtenerTextoProvider(): string {
    if (!this.usuario) return '';
    return this.usuario.provider === 'google' ? 'Google' : 'Email';
  }
}