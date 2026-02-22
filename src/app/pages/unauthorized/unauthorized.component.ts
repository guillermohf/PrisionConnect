// src/app/features/unauthorized/unauthorized.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'prisionConnect-unauthorized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-lg shadow-xl p-8 text-center">
          <!-- Icono -->
          <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <!-- Título -->
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            Acceso Denegado
          </h1>

          <!-- Mensaje -->
          <p class="text-gray-600 mb-6">
            No tienes permisos para acceder a esta página. Si crees que esto es un error, contacta al administrador.
          </p>

          <!-- Botones -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              (click)="volver()"
              class="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Volver
            </button>
            
            <button
              (click)="irDashboard()"
              class="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {
  constructor(private router: Router) {}

  volver(): void {
    window.history.back();
  }

  irDashboard(): void {
    this.router.navigate(['/main-layout/dashboard']);
  }
}