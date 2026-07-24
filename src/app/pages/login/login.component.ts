// src/app/pages/login/login.component.ts

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { RolUsuario } from '@core/models/enums.interface';

@Component({
  standalone: true,
  selector: 'prisionConnect-login',
  templateUrl: './login.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export default class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const { email, password } = this.loginForm.value;

    const result = await this.authService.login(email, password);

    if (result.success) {
      this.verificarYRedirigir();
    } else {
      this.errorMessage = result.message || 'Error desconocido';
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    this.loading = true;
    this.errorMessage = '';

    const result = await this.authService.signInWithGoogle();

    if (result.success) {
      this.verificarYRedirigir();
    } else {
      this.errorMessage = result.message || 'Error con Google';
      this.loading = false;
    }
  }

  /**
   * ⭐ Método auxiliar para asegurar que el perfil de Firestore cargó
   * antes de intentar entrar al Dashboard protegido por los Guards.
   */
  private async verificarYRedirigir() {
    // Pequeña espera para permitir que el listener de onSnapshot en AuthService responda
    let intentos = 0;
    const maxIntentos = 10; // 2 segundos máximo

    const interval = setInterval(() => {
      intentos++;
      
      // Si el perfil cargó con éxito
      if (this.authService.usuario()) {
        clearInterval(interval);
        const rol = this.authService.userRole();
        if (rol === RolUsuario.SEGURIDAD_PUERTA) {
          this.router.navigate(['/visitas-activas']);
        } else if (rol === RolUsuario.SEGURIDAD_RECEPCION) {
          this.router.navigate(['/visitas']);
        } else if (rol === RolUsuario.SEGURIDAD_REQUISA) {
          this.router.navigate(['/requisa']);
        } else if (rol === RolUsuario.DATA_ENTRY) {
          this.router.navigate(['/visitantes']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.loading = false;
      } 
      // Si llegamos al límite y no hay perfil, probablemente no existe en Firestore
      else if (intentos >= maxIntentos) {
        clearInterval(interval);
        this.errorMessage = 'Tu cuenta no tiene un perfil asignado en el sistema. Contacta al administrador.';
        this.loading = false;
      }
    }, 200);
  }
}