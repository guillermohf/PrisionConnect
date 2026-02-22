// src/app/core/models/relacion.interface.ts

import { Timestamp } from 'firebase/firestore';
import { Parentesco, TipoAbogado, TipoCaso, EstadoCaso } from './enums.interface';

/**
 * Interface para Relación Visitante-Recluso
 */
export interface RelacionVisitante {
  id?: string;
  reclusoId: string;
  reclusoNombre: string;
  visitanteId: string;
  visitanteNombre: string;
  parentesco: Parentesco;
  autorizado: boolean;
  fechaAutorizacion: Timestamp | Date;
  fechaVencimiento?: Timestamp | Date | null;
  activo: boolean;
  observaciones?: string;
  fechaCreacion: Timestamp | Date;
}

/**
 * Interface para Relación Abogado-Recluso
 */
export interface RelacionAbogado {
  id?: string;
  abogadoId: string;
  abogadoNombre: string;
  abogadoExequatur: string;
  abogadoTipo: TipoAbogado;
  reclusoId: string;
  reclusoNombre: string;
  reclusoPabellon: string;
  fechaAsignacion: Timestamp | Date;
  fechaFinalizacion?: Timestamp | Date | null;
  activo: boolean;
  tipoCaso: TipoCaso;
  numeroExpediente: string;
  estadoCaso: EstadoCaso;
  observaciones?: string;
  fechaCreacion: Timestamp | Date;
}

/**
 * DTO para autorizar un visitante
 */
export interface AutorizarVisitanteDTO {
  reclusoId: string;
  visitanteId: string;
  parentesco: Parentesco;
  fechaVencimiento?: Date;
  observaciones?: string;
}

/**
 * DTO para asignar un abogado
 */
export interface AsignarAbogadoDTO {
  abogadoId: string;
  reclusoId: string;
  tipoCaso: TipoCaso;
  numeroExpediente: string;
  observaciones?: string;
}

/**
 * DTO para actualizar relación visitante
 */
export interface ActualizarRelacionVisitanteDTO {
  parentesco?: Parentesco;
  autorizado?: boolean;
  fechaVencimiento?: Date | null;
  activo?: boolean;
  observaciones?: string;
}

/**
 * DTO para actualizar relación abogado
 */
export interface ActualizarRelacionAbogadoDTO {
  estadoCaso?: EstadoCaso;
  fechaFinalizacion?: Date | null;
  activo?: boolean;
  observaciones?: string;
}