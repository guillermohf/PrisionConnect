// src/app/core/models/recluso.interface.ts

import { Timestamp } from 'firebase/firestore';
import { SituacionLegal, EstadoCivil, EstadoRecluso } from './enums.interface';

/**
 * Interface para Recluso
 */
export interface Recluso {
  id?: string;
  
  // Identificación
  numeroIdentificacion: string;
  cedula?: string;
  numeroExpediente?: string;
  
  // Información Personal
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  fechaNacimiento: Timestamp | Date;
  edad: number;
  sexo?: 'Masculino' | 'Femenino';
  nacionalidad?: string;
  estadoCivil?: EstadoCivil;
  fotoUrl?: string;
  
  // Información de Contacto
  direccion?: string;
  telefono?: string;
  nombreContactoEmergencia?: string;
  telefonoEmergencia?: string;
  
  // Ubicación en el Penal
  pabellon: string;
  celda: string;
  
  // Información Penal
  fechaIngreso: Timestamp | Date;
  situacionLegal: SituacionLegal;
  estado?: EstadoRecluso;
  delito?: string;
  sentencia?: number; // años
  fechaEstimadaSalida?: Timestamp | Date;
  
  // Información Médica
  tipoSangre?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  medicamentos?: string;
  
  // Información Adicional
  educacion?: string;
  profesion?: string;
  hijos?: number;
  
  // Datos Físicos
  altura?: number; // cm
  peso?: number; // kg
  señasParticulares?: string;
  
  // Estado y Observaciones
  activo: boolean;
  observaciones?: string;
  
  // Estadísticas
  estadisticas: EstadisticasRecluso;
  
  // Auditoría
  fechaCreacion: Timestamp | Date;
  fechaActualizacion: Timestamp | Date;
  creadoPor?: string;
  modificadoPor?: string;
}

/**
 * Estadísticas del Recluso
 */
export interface EstadisticasRecluso {
  totalVisitantes: number;
  totalAbogados: number;
  totalVisitas: number;
  ultimaVisita?: Timestamp | Date | null;
}

/**
 * DTO para crear un nuevo recluso
 */
export interface CrearReclusoDTO {
  // Campos base (requeridos)
  numeroIdentificacion: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  pabellon: string;
  celda: string;
  fechaIngreso: Date;
  situacionLegal: SituacionLegal;
  
  // Campos adicionales
  cedula?: string;
  numeroExpediente?: string;
  sexo?: 'Masculino' | 'Femenino';
  nacionalidad?: string;
  estadoCivil?: EstadoCivil;
  estado?: EstadoRecluso;
  
  // Contacto
  direccion?: string;
  telefono?: string;
  nombreContactoEmergencia?: string;
  telefonoEmergencia?: string;
  
  // Información Penal Adicional
  delito?: string;
  sentencia?: number;
  
  // Información Médica
  tipoSangre?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  medicamentos?: string;
  
  // Información Adicional
  educacion?: string;
  profesion?: string;
  hijos?: number;
  
  // Datos Físicos
  altura?: number;
  peso?: number;
  señasParticulares?: string;
  
  // Otros
  observaciones?: string;
  fotoUrl?: string;
}

/**
 * DTO para actualizar un recluso
 */
export interface ActualizarReclusoDTO {
  // Ubicación
  pabellon?: string;
  celda?: string;
  
  // Información Legal
  situacionLegal?: SituacionLegal;
  estado?: EstadoRecluso;
  delito?: string;
  sentencia?: number;
  
  // Personal
  cedula?: string;
  sexo?: 'Masculino' | 'Femenino';
  nacionalidad?: string;
  estadoCivil?: EstadoCivil;
  fechaNacimiento?: Date;
  fechaIngreso?: Date;
  
  // Contacto
  direccion?: string;
  telefono?: string;
  nombreContactoEmergencia?: string;
  telefonoEmergencia?: string;
  
  // Información Médica
  tipoSangre?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  medicamentos?: string;
  
  // Información Adicional
  educacion?: string;
  profesion?: string;
  hijos?: number;
  
  // Datos Físicos
  altura?: number;
  peso?: number;
  señasParticulares?: string;
  
  // Estado y Otros
  observaciones?: string;
  fotoUrl?: string;
  activo?: boolean;
}

/**
 * Filtros para búsqueda de reclusos
 */
export interface FiltrosReclusos {
  pabellon?: string;
  situacionLegal?: SituacionLegal;
  estado?: EstadoRecluso;
  sexo?: 'Masculino' | 'Femenino';
  activo?: boolean;
  busqueda?: string; // búsqueda por nombre, número o cédula
}

/**
 * Estadísticas de recluso para reportes
 */
export interface ReclusoStats {
  reclusoId: string;
  nombreCompleto: string;
  totalVisitas: number;
  pabellon: string;
}