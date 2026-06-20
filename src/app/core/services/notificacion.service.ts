// src/app/core/services/notificacion.service.ts

import { Injectable } from '@angular/core';
import Swal, { SweetAlertIcon, SweetAlertResult } from 'sweetalert2';

/**
 * Configuración del Toast base (top-end, sin botón, cierre automático)
 * Se usa para notificaciones no bloqueantes: éxito, info, advertencia leve.
 */
const ToastBase = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {

  /**
   * Toast de éxito — esquina superior derecha, cierre automático.
   * Usar para operaciones completadas (guardar, actualizar, etc.).
   */
  success(mensaje: string, titulo: string = '¡Éxito!'): void {
    ToastBase.fire({
      icon: 'success',
      title: titulo,
      text: mensaje,
      timer: 3500,
      background: '#f0fdf4',
      color: '#166534',
      iconColor: '#16a34a'
    });
  }

  /**
   * Muestra un "recibo" o tarjeta de confirmación de éxito con detalles HTML.
   * Usar para validación visual de registros complejos creados.
   */
  successCard(titulo: string, htmlContent: string): void {
    Swal.fire({
      title: titulo,
      html: htmlContent,
      icon: 'success',
      confirmButtonText: 'Cerrar y Continuar',
      confirmButtonColor: '#0f766e', // teal-700
      customClass: {
        popup: 'rounded-2xl shadow-2xl p-6',
        title: 'text-2xl font-bold text-gray-800 mt-2',
        htmlContainer: 'text-left mt-4 !m-0',
        confirmButton: 'rounded-lg px-6 py-2.5 font-semibold w-full'
      }
    });
  }

  /**
   * Toast de error — esquina superior derecha, más duración para que se lea.
   * Usar para errores de operaciones que NO requieren acción del usuario.
   * Para errores que SÍ requieren acción, usar confirmar().
   */
  error(mensaje: string, titulo: string = 'Error'): void {
    ToastBase.fire({
      icon: 'error',
      title: titulo,
      text: mensaje,
      timer: 5000,
      background: '#fef2f2',
      color: '#991b1b',
      iconColor: '#ef4444'
    });
  }

  /**
   * Toast de advertencia — esquina superior derecha, cierre automático.
   * Usar para avisos que no bloquean el flujo de trabajo.
   */
  warning(mensaje: string, titulo: string = 'Advertencia'): void {
    ToastBase.fire({
      icon: 'warning',
      title: titulo,
      text: mensaje,
      timer: 4500,
      background: '#fffbeb',
      color: '#92400e',
      iconColor: '#f59e0b'
    });
  }

  /**
   * Toast de información — esquina superior derecha, cierre automático.
   */
  info(mensaje: string, titulo: string = 'Información'): void {
    ToastBase.fire({
      icon: 'info',
      title: titulo,
      text: mensaje,
      timer: 4000,
      background: '#eff6ff',
      color: '#1e40af',
      iconColor: '#3b82f6'
    });
  }

  /**
   * Confirmar acción — Modal CENTRADO bloqueante.
   * Usar solo cuando se necesita respuesta explícita del usuario (eliminar, aprobar, etc.).
   */
  async confirmar(
    titulo: string,
    mensaje: string,
    textoConfirmar: string = 'Sí, continuar',
    textoCancelar: string = 'Cancelar'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: titulo,
      text: mensaje,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: textoConfirmar,
      cancelButtonText: textoCancelar,
      confirmButtonColor: '#008080',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold'
      }
    });

    return result.isConfirmed;
  }

  /**
   * Confirmar desactivación — Modal CENTRADO bloqueante.
   */
  async confirmarEliminacion(
    entidad: string = 'este registro'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se desactivará ${entidad}. Podrás reactivarlo después.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold'
      }
    });

    return result.isConfirmed;
  }

  /**
   * Confirmar eliminación permanente — Modal CENTRADO bloqueante, más agresivo.
   */
  async confirmarEliminacionPermanente(
    entidad: string = 'este registro'
  ): Promise<boolean> {
    const result = await Swal.fire({
      title: '⚠️ ¡ADVERTENCIA!',
      html: `
        <p>Estás a punto de <strong>eliminar permanentemente</strong> ${entidad}.</p>
        <p style="color:#dc2626;font-weight:bold;margin-top:8px;">Esta acción NO se puede deshacer.</p>
      `,
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar permanentemente',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold'
      }
    });

    return result.isConfirmed;
  }

  /**
   * Toast genérico — esquina superior derecha.
   * @deprecated Usar success(), error(), warning() o info() directamente.
   */
  toast(
    mensaje: string,
    tipo: SweetAlertIcon = 'success',
    duracion: number = 3000
  ): void {
    ToastBase.fire({
      icon: tipo,
      title: mensaje,
      timer: duracion
    });
  }

  /**
   * Mostrar loading — modal bloqueante de carga.
   */
  loading(mensaje: string = 'Procesando...'): void {
    Swal.fire({
      title: mensaje,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        popup: 'rounded-xl shadow-2xl'
      },
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Cerrar loading
   */
  cerrarLoading(): void {
    Swal.close();
  }

  /**
   * Input de texto — modal centrado con campo de texto.
   */
  async input(
    titulo: string,
    placeholder: string = '',
    valorInicial: string = ''
  ): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'text',
      inputPlaceholder: placeholder,
      inputValue: valorInicial,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#008080',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        input: 'rounded-lg border-2 border-gray-300 focus:border-teal-500',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Este campo es requerido';
        }
        return null;
      }
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Textarea — modal centrado con campo de texto multilínea.
   */
  async textarea(
    titulo: string,
    placeholder: string = '',
    valorInicial: string = ''
  ): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'textarea',
      inputPlaceholder: placeholder,
      inputValue: valorInicial,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#008080',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        input: 'rounded-lg border-2 border-gray-300 focus:border-teal-500',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold'
      }
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Selector de opciones — modal centrado con dropdown.
   */
  async select(
    titulo: string,
    opciones: { [key: string]: string },
    valorInicial?: string
  ): Promise<string | null> {
    const result = await Swal.fire({
      title: titulo,
      input: 'select',
      inputOptions: opciones,
      inputValue: valorInicial,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#008080',
      cancelButtonColor: '#6b7280',
      customClass: {
        popup: 'rounded-xl shadow-2xl',
        confirmButton: 'rounded-lg px-5 py-2.5 font-semibold',
        cancelButton: 'rounded-lg px-5 py-2.5 font-semibold'
      },
      inputValidator: (value) => {
        if (!value) {
          return 'Debes seleccionar una opción';
        }
        return null;
      }
    });

    return result.isConfirmed ? result.value : null;
  }

  /**
   * Ejecutar operación con loading automático.
   * Muestra loading → ejecuta → muestra toast de éxito o error.
   */
  async conProgreso<T>(
    promesa: Promise<T>,
    mensajeCargando: string = 'Procesando...',
    mensajeExito: string = 'Operación completada',
    mensajeError: string = 'Ocurrió un error'
  ): Promise<T | null> {
    this.loading(mensajeCargando);

    try {
      const resultado = await promesa;
      this.cerrarLoading();
      this.success(mensajeExito);
      return resultado;
    } catch (error: any) {
      this.cerrarLoading();
      this.error(error.message || mensajeError);
      return null;
    }
  }
}