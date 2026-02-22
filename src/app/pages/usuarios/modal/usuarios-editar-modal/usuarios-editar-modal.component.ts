// src/app/features/usuarios/components/usuario-editar-modal/usuario-editar-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '@core/services/usuarios.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Usuario } from '@core/models/usuario.interface';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'prisionConnect-usuario-editar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent
],
  templateUrl: './usuarios-editar-modal.component.html'
})
export class UsuarioEditarModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() usuarioActualizado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);

  guardando = false;
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      avatar: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    if (!this.usuario) return;

    this.form.patchValue({
      nombre: this.usuario.nombre,
      apellido: this.usuario.apellido,
      avatar: this.usuario.avatar || ''
    });
  }

  async guardar(): Promise<void> {
    if (!this.form.valid || !this.usuario?.id) {
      this.notificacionService.error('Por favor completa todos los campos correctamente');
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.usuariosService.actualizarPerfil(
        this.usuario.id,
        this.form.value
      );

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.usuarioActualizado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al actualizar usuario');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.form.reset();
  }

  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  obtenerMensajeError(campo: string): string {
    const control = this.form.get(campo);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    
    return '';
  }

  obtenerNombreRol(): string {
    return this.usuario ? this.usuariosService.obtenerNombreRol(this.usuario.rol) : '';
  }

  obtenerColorRol(): string {
    return this.usuario ? this.usuariosService.obtenerColorRol(this.usuario.rol) : '';
  }
}