// src/app/pages/perfil/perfil.component.ts
// 🎨 BRANDING: #006666, #008080, #1A2626

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { UsuariosService } from '@core/services/usuarios.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Usuario } from '@core/models/usuario.interface';
import { RolUsuario } from '@core/models/enums.interface';

@Component({
  selector: 'prisionConnect-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil.component.html'
})
export default class PerfilComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);

  usuario = this.authService.usuario;
  loading = false;
  loadingInicial = true;
  editandoPerfil = false;
  cambiandoPassword = false;

  formPerfil: FormGroup;
  formPassword: FormGroup;

  RolUsuario = RolUsuario;

  constructor() {
    this.formPerfil = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.formPassword = this.fb.group({
      passwordActual: ['', Validators.required],
      passwordNuevo: ['', [Validators.required, Validators.minLength(6)]],
      passwordConfirmar: ['', Validators.required]
    }, {
      validators: this.passwordsCoinciden
    });
  }

  ngOnInit(): void {
    this.loadingInicial = true;
    setTimeout(() => {
      this.cargarDatosUsuario();
      this.loadingInicial = false;
    }, 100);
  }

  cargarDatosUsuario(): void {
    const user = this.usuario();
    if (user) {
      const nombreCompleto = user.nombreCompleto || `${user.nombre} ${user.apellido || ''}`.trim();

      this.formPerfil.patchValue({
        nombre: nombreCompleto,
        email: user.email
      });

      this.formPerfil.get('email')?.disable();
    }
  }

  passwordsCoinciden(group: FormGroup): { [key: string]: boolean } | null {
    const nuevo = group.get('passwordNuevo')?.value;
    const confirmar = group.get('passwordConfirmar')?.value;
    return nuevo === confirmar ? null : { passwordsNoCoinciden: true };
  }

  toggleEditarPerfil(): void {
    this.editandoPerfil = !this.editandoPerfil;
    if (!this.editandoPerfil) {
      this.cargarDatosUsuario();
    }
  }

  async guardarPerfil(): Promise<void> {
    if (this.formPerfil.invalid) {
      Object.keys(this.formPerfil.controls).forEach(key => {
        this.formPerfil.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    const user = this.usuario();
    if (!user?.id) {
      this.notificacionService.error('No se pudo obtener el usuario');
      this.loading = false;
      return;
    }

    try {
      const nombreCompleto = this.formPerfil.get('nombre')?.value.trim();

      const partes = nombreCompleto.split(' ');
      const primerNombre = partes[0];
      const apellido = partes.slice(1).join(' ') || primerNombre;

      const datos: Partial<Usuario> = {
        nombre: primerNombre,
        apellido: apellido,
        nombreCompleto: nombreCompleto
      };

      // ✅ CORREGIDO: usar actualizar en lugar de actualizarPerfil
      const resultado = await this.usuariosService.actualizarPerfil(user.id, datos);

      if (resultado.success) {
        this.notificacionService.success('Perfil actualizado exitosamente');
        this.editandoPerfil = false;
        window.location.reload();
      } else {
        this.notificacionService.error(resultado.message || 'Error al actualizar el perfil');
      }
    } catch (error: any) {
      this.notificacionService.error(error.message || 'Error al actualizar el perfil');
    }

    this.loading = false;
  }

  async cambiarPassword(): Promise<void> {
    if (this.formPassword.invalid) {
      Object.keys(this.formPassword.controls).forEach(key => {
        this.formPassword.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;

    try {
      const user = this.usuario();
      if (!user?.email) {
        throw new Error('No se pudo obtener el email del usuario');
      }

      this.notificacionService.info(
        'Funcionalidad de cambio de contraseña en desarrollo. ' +
        'Por favor contacta al administrador del sistema.'
      );

      this.formPassword.reset();
      this.cambiandoPassword = false;

    } catch (error: any) {
      this.notificacionService.error(error.message || 'Error al cambiar la contraseña');
    }

    this.loading = false;
  }

  toggleCambiarPassword(): void {
    this.cambiandoPassword = !this.cambiandoPassword;
    if (!this.cambiandoPassword) {
      this.formPassword.reset();
    }
  }

  obtenerNombreRol(rol: RolUsuario): string {
    const roles: { [key in RolUsuario]: string } = {
      [RolUsuario.SUPER_ADMINISTRADOR]: 'Super Administrador',
      [RolUsuario.SUPERVISOR]: 'Supervisor',
      [RolUsuario.DATA_ENTRY]: 'Operador de Datos',
      [RolUsuario.SEGURIDAD_RECEPCION]: 'Seguridad - Recepción',
      [RolUsuario.SEGURIDAD_REQUISA]: 'Seguridad - Requisa'
    };
    return roles[rol] || rol;
  }

  obtenerColorRol(rol: RolUsuario): string {
    const colores: { [key in RolUsuario]: string } = {
      [RolUsuario.SUPER_ADMINISTRADOR]: 'bg-purple-100 text-purple-800 border-purple-300',
      [RolUsuario.SUPERVISOR]: 'bg-blue-100 text-blue-800 border-blue-300',
      [RolUsuario.DATA_ENTRY]: 'bg-green-100 text-green-800 border-green-300',
      [RolUsuario.SEGURIDAD_RECEPCION]: 'bg-orange-100 text-orange-800 border-orange-300',
      [RolUsuario.SEGURIDAD_REQUISA]: 'bg-red-100 text-red-800 border-red-300'
    };
    return colores[rol] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : fecha.toDate();
      return fechaObj.toLocaleDateString('es-DO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  }

async cerrarSesion(): Promise<void> {
    await this.authService.logout();

}

}