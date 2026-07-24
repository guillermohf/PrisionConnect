// src/app/pages/usuarios/modal/usuarios-crear-modal/usuarios-crear-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosService } from '@core/services/usuarios.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { RolUsuario } from '@core/models/enums.interface';
import { ModalComponent } from '@shared/modal/modal.component';

@Component({
  selector: 'prisionConnect-usuarios-agregar-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './usuarios-agregar-modal.component.html'
})
export class UsuariosAgregarModalComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() usuarioCreado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);

  guardando = false;
  form: FormGroup;
  
  // Exponemos el enum al template para el select
  RolUsuario = RolUsuario;
  
  // Lista de roles para iterar en el select
  rolesDisponibles = [
    { valor: RolUsuario.SUPER_ADMINISTRADOR, nombre: 'Super Administrador' },
    { valor: RolUsuario.SUPERVISOR, nombre: 'Supervisor' },
    { valor: RolUsuario.DATA_ENTRY, nombre: 'Data Entry' },
    { valor: RolUsuario.SEGURIDAD_RECEPCION, nombre: 'Seguridad Recepción' },
    { valor: RolUsuario.SEGURIDAD_REQUISA, nombre: 'Seguridad Requisa' },
    { valor: RolUsuario.SEGURIDAD_PUERTA, nombre: 'Seguridad Puerta (Control Entrada)' }
  ];

  constructor() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rol: ['', Validators.required]
      // No pedimos contraseña; el sistema le enviará un correo para crearla (o se genera una por defecto)
    });
  }

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.notificacionService.error('Por favor completa todos los campos correctamente');
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    try {
      // Llamaremos a una nueva función en el servicio que conectará con la Cloud Function
      const resultado = await this.usuariosService.crearNuevoUsuarioDirecto(this.form.value);
      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.usuarioCreado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error: any) {
      this.notificacionService.error('Error inesperado al crear el usuario');
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
    if (control?.hasError('required')) return 'Este campo es obligatorio';
    if (control?.hasError('email')) return 'Ingresa un correo electrónico válido';
    if (control?.hasError('minlength')) return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    return '';
  }
}