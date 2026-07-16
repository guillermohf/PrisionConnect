// src/app/core/models/configuracion.interface.ts

/**
 * Interface para Configuración del Sistema
 */
export interface Configuracion {
  id?: string;
  horarioVisitas: HorarioVisitas;
  duracionMaximaVisita: number;
  visitantesPorDia: number;
  visitantesPorRecluso: number;
  tiempoAdvertencia: number;
  areasVisita: string[];
  pabellones: string[];
}

/**
 * Horario de visitas por día
 */
export interface HorarioVisitas {
  lunes: HorarioDia;
  martes: HorarioDia;
  miercoles: HorarioDia;
  jueves: HorarioDia;
  viernes: HorarioDia;
  sabado: HorarioDia;
  domingo: HorarioDia;
}

/**
 * Horario de un día específico
 */
export interface HorarioDia {
  inicio: string;
  fin: string;
  activo: boolean;
}

/**
 * DTO para actualizar configuración
 */
export interface ActualizarConfiguracionDTO {
  horarioVisitas?: Partial<HorarioVisitas>;
  duracionMaximaVisita?: number;
  visitantesPorDia?: number;
  visitantesPorRecluso?: number;
  tiempoAdvertencia?: number;
  areasVisita?: string[];
  pabellones?: string[];
}

/**
 * DTO para actualizar horario de un día
 */
export interface ActualizarHorarioDiaDTO {
  dia: DiaSemana;
  inicio?: string;
  fin?: string;
  activo?: boolean;
}

/**
 * Días de la semana
 */
export type DiaSemana = 
  | 'lunes' 
  | 'martes' 
  | 'miercoles' 
  | 'jueves' 
  | 'viernes' 
  | 'sabado' 
  | 'domingo';