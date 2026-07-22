// src/app/core/models/configuracion.interface.ts

/**
 * Configuración de un pabellón con celdas y capacidad
 */
export interface PabellonConfig {
  nombre: string;         // Ej: 'Pabellón E'
  celdaInicio: number;    // Ej: 1
  celdaFin: number;       // Ej: 100
  capacidadPorCelda: number; // Personas por celda
}

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
  intervaloRevisionMonitor?: number; // Frecuencia de revisión del monitor en segundos
  maxVisitasSimultaneasRecluso?: number; // Máximo de visitas activas al mismo tiempo por recluso
  diasSancionIncidencia?: number; // Días de prohibición/sanción tras incidencia grave
  edadMinimaAdulto?: number; // Edad mínima para visitantes independientes
  areasVisita: string[];
  pabellones: string[];          // nombres simples (compatibilidad)
  pabellonesConfig?: PabellonConfig[]; // configuración extendida
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
  intervaloRevisionMonitor?: number;
  maxVisitasSimultaneasRecluso?: number;
  diasSancionIncidencia?: number;
  edadMinimaAdulto?: number;
  areasVisita?: string[];
  pabellones?: string[];
  pabellonesConfig?: PabellonConfig[];
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