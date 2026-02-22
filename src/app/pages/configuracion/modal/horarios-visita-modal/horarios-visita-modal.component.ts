// src/app/features/configuracion/components/horarios-visita/horarios-visita.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '@core/services/configuracion.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Configuracion, DiaSemana, HorarioDia } from '@core/models/configuracion.interface';

interface DiaConfig {
  dia: DiaSemana;
  label: string;
  horario: HorarioDia;
}

@Component({
  selector: 'prisionConnect-horarios-visita-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios-visita-modal.component.html'
})
export class HorariosVisitaModalComponent {
  @Input() configuracion: Configuracion | null = null;
  @Output() cambiosRealizados = new EventEmitter<void>();

  private configuracionService = inject(ConfiguracionService);
  private notificacionService = inject(NotificacionService);

  diasSemana: DiaConfig[] = [];
  guardando = false;

  ngOnChanges(): void {
    if (this.configuracion) {
      this.cargarDiasSemana();
    }
  }

  private cargarDiasSemana(): void {
    if (!this.configuracion) return;

    this.diasSemana = [
      { dia: 'lunes', label: 'Lunes', horario: { ...this.configuracion.horarioVisitas.lunes } },
      { dia: 'martes', label: 'Martes', horario: { ...this.configuracion.horarioVisitas.martes } },
      { dia: 'miercoles', label: 'Miércoles', horario: { ...this.configuracion.horarioVisitas.miercoles } },
      { dia: 'jueves', label: 'Jueves', horario: { ...this.configuracion.horarioVisitas.jueves } },
      { dia: 'viernes', label: 'Viernes', horario: { ...this.configuracion.horarioVisitas.viernes } },
      { dia: 'sabado', label: 'Sábado', horario: { ...this.configuracion.horarioVisitas.sabado } },
      { dia: 'domingo', label: 'Domingo', horario: { ...this.configuracion.horarioVisitas.domingo } }
    ];
  }

  async toggleDia(diaConfig: DiaConfig): Promise<void> {
    const nuevoEstado = !diaConfig.horario.activo;
    
    // Validar que al menos quede 1 día activo
    const diasActivos = this.diasSemana.filter(d => d.horario.activo).length;
    if (diasActivos === 1 && !nuevoEstado) {
      this.notificacionService.error('Debe haber al menos 1 día activo');
      return;
    }

    this.guardando = true;

    const resultado = await this.configuracionService.actualizarHorarioDia(
      diaConfig.dia,
      { activo: nuevoEstado }
    );

    if (resultado.success) {
      diaConfig.horario.activo = nuevoEstado;
      this.notificacionService.success(resultado.message);
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.guardando = false;
  }

  async actualizarHorario(diaConfig: DiaConfig): Promise<void> {
    // Validar horario
    if (!this.validarHorario(diaConfig.horario.inicio, diaConfig.horario.fin)) {
      this.notificacionService.error('La hora de inicio debe ser menor que la hora de fin');
      return;
    }

    this.guardando = true;

    const resultado = await this.configuracionService.actualizarHorarioDia(
      diaConfig.dia,
      {
        inicio: diaConfig.horario.inicio,
        fin: diaConfig.horario.fin
      }
    );

    if (resultado.success) {
      this.notificacionService.success(resultado.message);
      this.cambiosRealizados.emit();
    } else {
      this.notificacionService.error(resultado.message);
    }

    this.guardando = false;
  }

  private validarHorario(inicio: string, fin: string): boolean {
    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);

    const minutosInicio = horaInicio * 60 + minInicio;
    const minutosFin = horaFin * 60 + minFin;

    return minutosFin > minutosInicio;
  }

  calcularDuracion(inicio: string, fin: string): string {
    if (!this.validarHorario(inicio, fin)) return '---';

    const [horaInicio, minInicio] = inicio.split(':').map(Number);
    const [horaFin, minFin] = fin.split(':').map(Number);

    const minutosInicio = horaInicio * 60 + minInicio;
    const minutosFin = horaFin * 60 + minFin;

    const duracionMinutos = minutosFin - minutosInicio;
    const horas = Math.floor(duracionMinutos / 60);
    const minutos = duracionMinutos % 60;

    if (horas > 0 && minutos > 0) {
      return `${horas}h ${minutos}min`;
    } else if (horas > 0) {
      return `${horas}h`;
    } else {
      return `${minutos}min`;
    }
  }

  calcularHorasSemanales(): number {
    return this.diasSemana
      .filter(d => d.horario.activo)
      .reduce((total, d) => {
        const [hi, mi] = d.horario.inicio.split(':').map(Number);
        const [hf, mf] = d.horario.fin.split(':').map(Number);
        const horas = ((hf * 60 + mf) - (hi * 60 + mi)) / 60;
        return total + horas;
      }, 0);
  }

  obtenerDiasActivos(): number {
    return this.diasSemana.filter(d => d.horario.activo).length;
  }

  obtenerDiasCerrados(): number {
    return 7 - this.obtenerDiasActivos();
  }

 async aplicarATodos(): Promise<void> {
  const confirmar = await this.notificacionService.confirmar(
    'Aplicar horario',
    '¿Deseas aplicar el horario de Lunes a todos los días de la semana? Los horarios individuales se sobrescribirán.',
    'Sí, aplicar',
    'Cancelar'
  );

  if (!confirmar) return;

  const horarioLunes = this.diasSemana[0].horario;

  this.guardando = true;

  for (let i = 1; i < this.diasSemana.length; i++) {
    const diaConfig = this.diasSemana[i];

    await this.configuracionService.actualizarHorarioDia(
      diaConfig.dia,
      {
        inicio: horarioLunes.inicio,
        fin: horarioLunes.fin,
        activo: horarioLunes.activo
      }
    );

    diaConfig.horario = { ...horarioLunes };
  }

  this.guardando = false;

  this.notificacionService.success('Horario aplicado a todos los días');
  this.cambiosRealizados.emit();
}

}