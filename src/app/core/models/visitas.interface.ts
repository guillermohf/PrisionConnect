// src/app/core/models/visita.interface.ts

import { Timestamp } from 'firebase/firestore';
import { 
  TipoVisita, 
  EstadoVisita, 
  Parentesco,
  TipoIncidencia,
  GravedadIncidencia
} from './enums.interface';
import { RequisaEntrada, RequisaSalida } from './requisa.interface';

/**
 * Interface para Visita
 */
export interface Visita {
  id?: string;
  codigoVisita?: string;      // Ej: VS-2026-00001
  tipo: TipoVisita;
  
  // Recluso
  reclusoId: string;
  reclusoNombre: string;
  reclusoPabellon: string;
  reclusoCelda: string;
  
  // Visitantes (array)
  visitantes: VisitanteEnVisita[];
  totalVisitantes: number;
  visitantesPresentes: number;
  
  // Abogado (si aplica)
  abogado: AbogadoEnVisita;
  
  // Fechas y horarios
  fechaVisita:  | Date | Timestamp;
  horaInicioProgramada: string;
  horaFinProgramada: string;
  checkInPrincipal?: Timestamp | Date | null;
  checkOutFinal?: Timestamp | Date | null;
  duracionTotal?: number;
  duracionVisitaReal?: number;
  
  // Estado
  estado: EstadoVisita;
  
  // Ubicación
  areaVisita: string;
  mesaNumero?: string;
  
  // Personal
  usuarioRecepcionId: string;
  usuarioRecepcionNombre: string;
  usuarioRequisaId?: string;
  usuarioRequisaNombre?: string;
  
  // Observaciones e incidencias
  observaciones?: string;
  incidencias: Incidencia[];
  
  // Requisa
  requisaEntrada?: RequisaEntrada;
  requisaSalida?: RequisaSalida;
  
  // Tiempos detallados
  tiempos: TiemposVisita;
  
  // Metadata
  fechaCreacion: Timestamp | Date;
  fechaActualizacion?: Timestamp | Date;
  creadoPor: string;
}

/**
 * Visitante en una visita específica
 */
export interface VisitanteEnVisita {
  visitanteId: string;
  nombre: string;
  cedula: string;
  parentesco: Parentesco;
  checkIn?: Timestamp | Date | null;
  checkOut?: Timestamp | Date | null;
  presente: boolean;
  observaciones?: string;
}

/**
 * Abogado en una visita legal
 */
export interface AbogadoEnVisita {
  abogadoId: string;
  nombre: string;
  exequatur: string;
  cedula: string;
  institucion: string;
  checkIn?: Timestamp | Date | null;
  checkOut?: Timestamp | Date | null;
}

/**
 * Incidencia en una visita
 */
export interface Incidencia {
  tipo: TipoIncidencia;
  descripcion: string;
  fecha: Timestamp | Date;
  usuarioReporte: string;
  gravedad: GravedadIncidencia;
}

/**
 * Tiempos detallados de una visita
 */
export interface TiemposVisita {
  registro: Timestamp | Date;
  inicioRequisaEntrada?: Timestamp | Date | null;
  finRequisaEntrada?: Timestamp | Date | null;
  ingresoArea?: Timestamp | Date | null;
  salidaArea?: Timestamp | Date | null;
  inicioRequisaSalida?: Timestamp | Date | null;
  finRequisaSalida?: Timestamp | Date | null;
  finalizacion?: Timestamp | Date | null;
}

/**
 * DTO para crear una visita
 */
export interface CrearVisitaDTO {
  tipo: TipoVisita;
  reclusoId: string;
  visitantes?: string[]; // IDs de visitantes
  abogadoId?: string;
  fechaVisita: Date;
  horaInicioProgramada: string;
  horaFinProgramada: string;
  areaVisita: string;
  observaciones?: string;
}

/**
 * DTO para check-in de visitante
 */
export interface CheckInVisitanteDTO {
  visitaId: string;
  visitanteId: string;
}

/**
 * DTO para check-out de visitante
 */
export interface CheckOutVisitanteDTO {
  visitaId: string;
  visitanteId: string;
  observaciones?: string;
}

/**
 * DTO para agregar incidencia
 */
export interface AgregarIncidenciaDTO {
  visitaId: string;
  tipo: TipoIncidencia;
  descripcion: string;
  gravedad: GravedadIncidencia;
}

/**
 * Filtros para búsqueda de visitas
 */
export interface FiltrosVisitas {
  estado?: EstadoVisita;
  tipo?: TipoVisita;
  reclusoId?: string;
  visitanteId?: string;
  abogadoId?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  areaVisita?: string;
}

export type { RequisaEntrada, RequisaSalida };
