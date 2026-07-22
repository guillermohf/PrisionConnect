// src/app/features/configuracion/components/parametros-sistema/parametros-sistema.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Configuracion } from '@core/models/configuracion.interface';

interface Parametro {
  key: keyof Pick<Configuracion, 'duracionMaximaVisita' | 'visitantesPorDia' | 'visitantesPorRecluso' | 'tiempoAdvertencia' | 'intervaloRevisionMonitor' | 'maxVisitasSimultaneasRecluso' | 'diasSancionIncidencia' | 'edadMinimaAdulto'>;
  label: string;
  descripcion: string;
  valor: number;
  unidad: string;
  min: number;
  max: number;
  icono: string;
  color: string;
}

@Component({
  selector: 'prisionConnect-parametros-sistema-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametros-sistema-modal.component.html'
})
export class ParametrosSistemaModalComponent {
  @Input() configuracion: Configuracion | null = null;
  @Output() cambiosRealizados = new EventEmitter<void>();

  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);

  parametros: Parametro[] = [];
  guardando = false;

  ngOnChanges(): void {
    if (this.configuracion) {
      this.cargarParametros();
    }
  }

  private cargarParametros(): void {
    if (!this.configuracion) return;

    this.parametros = [
      {
        key: 'duracionMaximaVisita',
        label: 'Duración Máxima de Visita',
        descripcion: 'Tiempo máximo permitido para una visita',
        valor: this.configuracion.duracionMaximaVisita,
        unidad: 'minutos',
        min: 30,
        max: 480,
        icono: 'clock',
        color: 'blue'
      },
      {
        key: 'visitantesPorDia',
        label: 'Visitantes por Día',
        descripcion: 'Límite diario de visitantes en el sistema',
        valor: this.configuracion.visitantesPorDia,
        unidad: 'visitantes',
        min: 10,
        max: 500,
        icono: 'users',
        color: 'green'
      },
      {
        key: 'visitantesPorRecluso',
        label: 'Visitantes por Recluso',
        descripcion: 'Máximo de personas permitidas en una sola visita',
        valor: this.configuracion.visitantesPorRecluso,
        unidad: 'personas',
        min: 1,
        max: 10,
        icono: 'group',
        color: 'purple'
      },
      {
        key: 'maxVisitasSimultaneasRecluso',
        label: 'Visitas Simultáneas por Recluso',
        descripcion: 'Máximo de visitas activas al mismo tiempo por recluso',
        valor: this.configuracion.maxVisitasSimultaneasRecluso ?? 1,
        unidad: 'visita(s)',
        min: 1,
        max: 5,
        icono: 'layer',
        color: 'indigo'
      },
      {
        key: 'tiempoAdvertencia',
        label: 'Tiempo de Advertencia',
        descripcion: 'Minutos antes de finalizar la visita para mostrar alerta',
        valor: this.configuracion.tiempoAdvertencia,
        unidad: 'minutos',
        min: 5,
        max: 60,
        icono: 'bell',
        color: 'orange'
      },
      {
        key: 'intervaloRevisionMonitor',
        label: 'Frecuencia de Monitoreo',
        descripcion: 'Segundos entre revisiones automáticas de alertas',
        valor: this.configuracion.intervaloRevisionMonitor ?? 15,
        unidad: 'segundos',
        min: 5,
        max: 60,
        icono: 'refresh',
        color: 'teal'
      },
      {
        key: 'diasSancionIncidencia',
        label: 'Días de Sanción por Incidencia',
        descripcion: 'Prohibición de entrada tras registrar una incidencia grave',
        valor: this.configuracion.diasSancionIncidencia ?? 30,
        unidad: 'días',
        min: 1,
        max: 180,
        icono: 'shield',
        color: 'red'
      },
      {
        key: 'edadMinimaAdulto',
        label: 'Edad Mínima Adulto',
        descripcion: 'Edad requerida para ingresar sin acompañante',
        valor: this.configuracion.edadMinimaAdulto ?? 18,
        unidad: 'años',
        min: 18,
        max: 21,
        icono: 'user-check',
        color: 'cyan'
      }
    ];
  }

  async actualizarParametro(parametro: Parametro): Promise<void> {
    // Validar rango
    if (parametro.valor < parametro.min || parametro.valor > parametro.max) {
      this.notificacionService.error(
        `El valor debe estar entre ${parametro.min} y ${parametro.max} ${parametro.unidad}`
      );
      // Restaurar valor original
      this.cargarParametros();
      return;
    }

    this.guardando = true;

    const datos: any = {};
    datos[parametro.key] = parametro.valor;

    const resultado = await this.configuracionService.actualizarConfiguracion(datos);

    if (resultado.success) {
      this.notificacionService.success(`${parametro.label} actualizado`);
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
      this.cargarParametros(); // Restaurar valores
    }

    this.guardando = false;
  }

  obtenerColorClase(color: string): string {
    const colores: Record<string, string> = {
      blue: 'from-blue-50 to-blue-100 border-blue-200',
      green: 'from-green-50 to-green-100 border-green-200',
      purple: 'from-purple-50 to-purple-100 border-purple-200',
      orange: 'from-orange-50 to-orange-100 border-orange-200',
      teal: 'from-teal-50 to-teal-100 border-teal-200',
      indigo: 'from-indigo-50 to-indigo-100 border-indigo-200',
      red: 'from-red-50 to-red-100 border-red-200',
      cyan: 'from-cyan-50 to-cyan-100 border-cyan-200'
    };
    return colores[color] || colores['blue'];
  }

  obtenerColorTexto(color: string): string {
    const colores: Record<string, string> = {
      blue: 'text-blue-900',
      green: 'text-green-900',
      purple: 'text-purple-900',
      orange: 'text-orange-900',
      teal: 'text-teal-900',
      indigo: 'text-indigo-900',
      red: 'text-red-900',
      cyan: 'text-cyan-900'
    };
    return colores[color] || colores['blue'];
  }

  obtenerColorLabel(color: string): string {
    const colores: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      teal: 'text-teal-600',
      indigo: 'text-indigo-600',
      red: 'text-red-600',
      cyan: 'text-cyan-600'
    };
    return colores[color] || colores['blue'];
  }

  formatearValor(parametro: Parametro): string {
    if (parametro.key === 'duracionMaximaVisita') {
      const horas = Math.floor(parametro.valor / 60);
      const minutos = parametro.valor % 60;
      
      if (horas > 0 && minutos > 0) {
        return `${horas}h ${minutos}min`;
      } else if (horas > 0) {
        return `${horas}h`;
      } else {
        return `${minutos}min`;
      }
    }
    
    return `${parametro.valor} ${parametro.unidad}`;
  }

  incrementar(parametro: Parametro, cantidad: number): void {
    const nuevoValor = parametro.valor + cantidad;
    if (nuevoValor >= parametro.min && nuevoValor <= parametro.max) {
      parametro.valor = nuevoValor;
      this.actualizarParametro(parametro);
    }
  }

  decrementar(parametro: Parametro, cantidad: number): void {
    const nuevoValor = parametro.valor - cantidad;
    if (nuevoValor >= parametro.min && nuevoValor <= parametro.max) {
      parametro.valor = nuevoValor;
      this.actualizarParametro(parametro);
    }
  }
}