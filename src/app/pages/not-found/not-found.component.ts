// src/app/features/not-found/not-found.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'prisionConnect-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-teal-50 to-gray-100 flex items-center justify-center px-4">
      <div class="max-w-2xl w-full">
        <div class="text-center">
          
          <!-- Número 404 grande -->
          <div class="mb-8">
            <h1 class="text-9xl font-bold text-teal-600 opacity-20 select-none">
              404
            </h1>
            <div class="-mt-20">
              <div class="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-xl">
                <svg class="h-16 w-16 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <!-- Contenido -->
          <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Página No Encontrada
            </h2>
            
            <p class="text-lg text-gray-600 mb-8">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>

            <!-- Sugerencias -->
            <div class="bg-teal-50 border-l-4 border-teal-600 rounded-lg p-6 mb-8 text-left">
              <h3 class="text-sm font-semibold text-teal-900 mb-3 flex items-center gap-2">
                <svg class="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sugerencias:
              </h3>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start gap-2">
                  <span class="text-teal-600 mt-0.5">•</span>
                  <span>Verifica que la URL esté escrita correctamente</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-600 mt-0.5">•</span>
                  <span>Regresa a la página anterior usando el botón "Volver"</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-teal-600 mt-0.5">•</span>
                  <span>Visita el Dashboard principal para navegar desde ahí</span>
                </li>
              </ul>
            </div>

            <!-- Botones de acción -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                (click)="volver()"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver Atrás
              </button>
              
              <button
                (click)="irInicio()"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/30">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ir al Dashboard
              </button>
            </div>

            <!-- Links rápidos -->
            <div class="mt-8 pt-6 border-t border-gray-200">
              <p class="text-sm font-medium text-gray-600 mb-4">Accesos rápidos:</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  (click)="navegarA('/dashboard')"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-teal-50 transition-colors group">
                  <svg class="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                  </svg>
                  <span class="text-xs text-gray-600 group-hover:text-teal-700">Dashboard</span>
                </button>

                <button
                  (click)="navegarA('/visitantes')"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-teal-50 transition-colors group">
                  <svg class="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-xs text-gray-600 group-hover:text-teal-700">Visitantes</span>
                </button>

                <button
                  (click)="navegarA('/recepcion')"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-teal-50 transition-colors group">
                  <svg class="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span class="text-xs text-gray-600 group-hover:text-teal-700">Recepción</span>
                </button>

                <button
                  (click)="navegarA('/reclusos')"
                  class="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-teal-50 transition-colors group">
                  <svg class="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span class="text-xs text-gray-600 group-hover:text-teal-700">Reclusos</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <p class="mt-6 text-sm text-gray-500">
            ¿Necesitas ayuda? Contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {
  constructor(private router: Router) {}

  volver(): void {
    window.history.back();
  }

  irInicio(): void {
    this.router.navigate(['/main-layout/dashboard']);
  }

  navegarA(ruta: string): void {
    this.router.navigate([ruta]);
  }
}