// src/app/core/services/visitas-monitor.service.ts

import { Injectable, inject } from '@angular/core';
import { VisitasService } from './visitas.service';
import { ConfiguracionService } from './configuracion.service';
import { AuthService } from './auth.service';
import { EstadoVisita, RolUsuario } from '@core/models/enums.interface';
import { Visita } from '@core/models/visitas.interface';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class VisitasMonitorService {
  private visitasService    = inject(VisitasService);
  private configuracionService = inject(ConfiguracionService);
  private authService = inject(AuthService);

  private timer: ReturnType<typeof setInterval> | null = null;

  /** IDs ya alertados para "por terminar" (evita Swal duplicado) */
  private alertadasPorTerminarIds = new Set<string>();

  /** IDs ya alertados para "pendiente requisa salida" */
  private alertadasPendienteIds = new Set<string>();

  // ─────────────────────────────────────────────────────────────
  // Ciclo de vida
  // ─────────────────────────────────────────────────────────────

  start(): void {
    this.reiniciarTimer();
    this.revisar();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  reiniciarTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const segs = this.configuracionService.configuracion()?.intervaloRevisionMonitor ?? 15;
    this.timer = setInterval(() => this.revisar(), segs * 1000);
  }

  // ─────────────────────────────────────────────────────────────
  // Revisión principal
  // ─────────────────────────────────────────────────────────────

  private async revisar(): Promise<void> {
    const rol = this.authService.userRole();
    if (!rol) return;

    const ahora = new Date();
    const horaActual =
      `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;
    const minutosAviso = this.configuracionService.configuracion()?.tiempoAdvertencia ?? 15;

    // ── 1. Mover vencidas → PENDIENTE_REQUISA_SALIDA ──────────
    const vencidas = this.visitasService.visitas().filter(
      v => v.estado === EstadoVisita.EN_CURSO &&
           v.horaFinProgramada &&
           v.horaFinProgramada <= horaActual
    );
    for (const v of vencidas) {
      if (!v.id) continue;
      await this.visitasService.cambiarEstado(v.id, EstadoVisita.PENDIENTE_REQUISA_SALIDA);
    }

    // ── 2. Alerta "por terminar" (Módulo Visitas Activas / Control Entrada) ──
    const puedeVerAlertaPorTerminar = [
      RolUsuario.SUPER_ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
      RolUsuario.SEGURIDAD_PUERTA
    ].includes(rol);

    if (puedeVerAlertaPorTerminar) {
      const porTerminar = this.obtenerVisitasPorTerminar(minutosAviso);
      const nuevasPorTerminar = porTerminar.filter(
        v => v.id && !this.alertadasPorTerminarIds.has(v.id!)
      );
      if (nuevasPorTerminar.length > 0) {
        nuevasPorTerminar.forEach(v => this.alertadasPorTerminarIds.add(v.id!));
        this.mostrarAlertaPorTerminar(nuevasPorTerminar, minutosAviso);
      }
    }

    // ── 3. Alerta "pendiente requisa salida sin procesar" (Módulo Requisa) ──
    const puedeVerAlertaRequisa = [
      RolUsuario.SUPER_ADMINISTRADOR,
      RolUsuario.SUPERVISOR,
      RolUsuario.SEGURIDAD_REQUISA
    ].includes(rol);

    if (puedeVerAlertaRequisa) {
      const pendientesRequisa = this.visitasService.visitas().filter(
        v => v.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA &&
             !v.requisaSalida
      );
      const nuevasPendientes = pendientesRequisa.filter(
        v => v.id && !this.alertadasPendienteIds.has(v.id!)
      );
      if (nuevasPendientes.length > 0) {
        nuevasPendientes.forEach(v => this.alertadasPendienteIds.add(v.id!));
        this.mostrarAlertaPendienteRequisa(nuevasPendientes);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers públicos
  // ─────────────────────────────────────────────────────────────

  /** Visitas EN_CURSO cuya horaFin cae dentro de los próximos N minutos */
  obtenerVisitasPorTerminar(minutosAviso: number): Visita[] {
    const ahora = new Date();
    const ahoraMins = ahora.getHours() * 60 + ahora.getMinutes();

    return this.visitasService.visitas().filter(v => {
      if (v.estado !== EstadoVisita.EN_CURSO || !v.horaFinProgramada) return false;
      const [h, m] = v.horaFinProgramada.split(':').map(Number);
      const finMins = h * 60 + m;
      const diff = finMins - ahoraMins;
      return diff > 0 && diff <= minutosAviso;
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Alertas Swal
  // ─────────────────────────────────────────────────────────────

  /** ⏰ Alerta: visita a punto de terminar */
  private mostrarAlertaPorTerminar(visitas: Visita[], minutosAviso: number): void {
    const lista = visitas.map(v => `
      <li class="py-1 border-b border-orange-100 last:border-0">
        <span class="font-semibold">${v.reclusoNombre}</span>
        <span class="text-orange-700 ml-2">— Fin: ${v.horaFinProgramada}</span>
        <span class="text-xs text-gray-500 ml-1">(${v.visitantes?.[0]?.nombre ?? 'N/A'})</span>
      </li>`
    ).join('');

    Swal.fire({
      icon: 'warning',
      title: `⏰ ${visitas.length} visita${visitas.length > 1 ? 's' : ''} por terminar`,
      html: `
        <p class="text-sm text-gray-600 mb-3">
          Finalizan en menos de <strong>${minutosAviso} minutos</strong>:
        </p>
        <ul class="text-left text-sm max-h-48 overflow-y-auto border border-orange-200 rounded-lg p-3 bg-orange-50">
          ${lista}
        </ul>
        <p class="text-xs text-gray-500 mt-3">Prepara el proceso de requisa de salida.</p>
      `,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#d97706',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-orange-800'
      }
    });
  }

  /** 🚨 Alerta: visita terminó pero no se ha hecho la requisa de salida */
  private mostrarAlertaPendienteRequisa(visitas: Visita[]): void {
    const lista = visitas.map(v => {
      // Calcular tiempo vencido
      const tiempoVencido = v.horaFinProgramada
        ? this.calcularTiempoVencido(v.horaFinProgramada)
        : 'desconocido';
      return `
        <li class="py-1.5 border-b border-red-100 last:border-0">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-red-900">${v.reclusoNombre}</span>
            <span class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">${tiempoVencido}</span>
          </div>
          <span class="text-xs text-gray-500">Visitante: ${v.visitantes?.[0]?.nombre ?? v.abogado?.nombre ?? 'N/A'} · Área: ${v.areaVisita}</span>
        </li>`;
    }).join('');

    Swal.fire({
      icon: 'error',
      title: `🚨 ${visitas.length} visita${visitas.length > 1 ? 's' : ''} sin requisa de salida`,
      html: `
        <p class="text-sm text-gray-600 mb-3">
          Las siguientes visitas <strong>ya vencieron</strong> y aún
          <strong class="text-red-600">no se ha realizado la requisa de salida</strong>:
        </p>
        <ul class="text-left text-sm max-h-52 overflow-y-auto border border-red-200 rounded-lg p-3 bg-red-50">
          ${lista}
        </ul>
        <p class="text-xs text-gray-500 mt-3">
          Dirígete a <strong>Requisa</strong> para procesar la salida.
        </p>
      `,
      confirmButtonText: 'Ir a Requisa',
      confirmButtonColor: '#dc2626',
      showCancelButton: true,
      cancelButtonText: 'Cerrar',
      cancelButtonColor: '#6b7280',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        popup: 'rounded-2xl shadow-2xl',
        title: 'text-xl font-bold text-red-800'
      }
    }).then(result => {
      if (result.isConfirmed) {
        // Navegar a la sección de requisa si el usuario confirma
        window.location.href = '/requisa';
      }
    });
  }

  /** Retorna string con el tiempo vencido desde horaFin */
  private calcularTiempoVencido(horaFin: string): string {
    const [h, m] = horaFin.split(':').map(Number);
    const ahora = new Date();
    const finMs = new Date().setHours(h, m, 0, 0);
    const diff = ahora.getTime() - finMs;
    if (diff <= 0) return 'En tiempo';
    const hrs = Math.floor(diff / 3_600_000);
    const min = Math.floor((diff % 3_600_000) / 60_000);
    return hrs > 0 ? `${hrs}h ${min}min vencido` : `${min}min vencido`;
  }
}
