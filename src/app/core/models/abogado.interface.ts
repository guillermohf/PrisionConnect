// src/app/core/models/abogado.interface.ts

import { Timestamp } from 'firebase/firestore';
import { TipoAbogado } from './enums.interface';

/**
 * Interface para Abogado
 */
export interface Abogado {
  id?: string;
  cedula: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  exequatur: string;
  tipo: TipoAbogado;
  institucion: string;
  telefono: string;
  email: string;
  activo: boolean;
  fotoUrl?: string;
  fechaRegistro: Timestamp | Date;
  estadisticas: EstadisticasAbogado;
  observaciones?: string;
}

/**
 * Estadísticas del Abogado
 */
export interface EstadisticasAbogado {
  totalReclusos: number;
  reclusosActivos: number;
  totalVisitas: number;
  ultimaVisita?: Timestamp | Date | null;
}

/**
 * DTO para crear un nuevo abogado
 */
export interface CrearAbogadoDTO {
  cedula: string;
  nombre: string;
  apellido: string;
  exequatur: string;
  tipo: TipoAbogado;
  institucion: string;
  telefono: string;
  email: string;
}

/**
 * DTO para actualizar un abogado
 */
export interface ActualizarAbogadoDTO {
  institucion?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  observaciones?: string;
}