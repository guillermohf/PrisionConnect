// src/app/core/models/visitante.interface.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Interface para Visitante
 */
export interface Visitante {
  id?: string;
  cedula: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  telefono: string;
  direccion: string;
  email?: string;
  fotoUrl?: string;
  activo: boolean;
  fechaNacimiento?: Date | any;
  fechaRegistro: Timestamp | Date;
  ultimaVisita?: Timestamp | Date | null;
  totalVisitas: number;
  observaciones?: string;
  nacionalidad?: string;
  pasaporte?: string;
}

/**
 * DTO para crear un nuevo visitante
 */
export interface CrearVisitanteDTO {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  email?: string;
  fotoUrl?: string;
  nacionalidad?: string;
  pasaporte?: string;
}

/**
 * DTO para actualizar un visitante
 */
export interface ActualizarVisitanteDTO {
  telefono?: string;
  direccion?: string;
  email?: string;
  fotoUrl?: string;
  activo?: boolean;
  observaciones?: string;
}

/**
 * Estadísticas de visitante para reportes
 */
export interface VisitanteStats {
  visitanteId: string;
  nombreCompleto: string;
  totalVisitas: number;
}