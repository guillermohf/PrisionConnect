// src/app/core/models/auxiliar.interface.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Notificación del sistema
 */
export interface Notificacion {
  id?: string;
  tipo: 'info' | 'warning' | 'error' | 'success';
  titulo: string;
  mensaje: string;
  usuarioId: string;
  leida: boolean;
  fecha: Timestamp | Date;
  accion?: AccionNotificacion;
}

/**
 * Acción de una notificación
 */
export interface AccionNotificacion {
  texto: string;
  ruta: string;
}

/**
 * Log de auditoría
 */
export interface LogAuditoria {
  id?: string;
  usuarioId: string;
  usuarioNombre: string;
  accion: string;
  entidad: string; // 'Visita', 'Recluso', etc.
  entidadId: string;
  detalles: any;
  fecha: Timestamp | Date;
  ip?: string;
}

/**
 * Respuesta de operación
 */
export interface RespuestaOperacion<T = any> {
  exito: boolean;
  mensaje: string;
  data?: T;
  error?: string;
}

/**
 * Paginación
 */
export interface Paginacion {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

/**
 * Resultado paginado
 */
export interface ResultadoPaginado<T> {
  items: T[];
  paginacion: Paginacion;
}

/**
 * Opciones de búsqueda
 */
export interface OpcionesBusqueda {
  termino: string;
  campo?: string;
  limite?: number;
}

/**
 * Archivo subido
 */
export interface ArchivoSubido {
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
}

/**
 * Error de validación
 */
export interface ErrorValidacion {
  campo: string;
  mensaje: string;
}