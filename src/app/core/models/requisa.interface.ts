// src/app/core/models/requisa.interface.ts

import { Timestamp } from 'firebase/firestore';
import { ResultadoRequisa } from './enums.interface';
import { Incidencia } from './visitas.interface';

/**
 * Requisa de Entrada
 */
export interface RequisaEntrada {
  realizada: boolean;
  resultado: ResultadoRequisa;
  fecha: Timestamp | Date;
  usuarioId: string;
  usuarioNombre: string;
  
  // Checklist
  detectorMetales: boolean;
  revisionVisual: boolean;
  revisionBolsos: boolean;
  revisionCorporal: boolean;
  
  // Objetos
  objetosDecomisados: ObjetoDecomisado[];
  
  observaciones?: string;
  incidencias: Incidencia[];
  duracion: number; // minutos
}

/**
 * Objeto decomisado en requisa
 */
export interface ObjetoDecomisado {
  objeto: string;
  cantidad: number;
  descripcion: string;
  devuelto: boolean;
  custodia: string;
}

/**
 * Requisa de Salida
 */
export interface RequisaSalida {
  realizada: boolean;
  resultado: ResultadoRequisa;
  fecha: Timestamp | Date;
  usuarioId: string;
  usuarioNombre: string;
  
  // Checklist
  revisionVisual: boolean;
  revisionBolsos: boolean;
  
  // Objetos devueltos
  objetosDevueltos: ObjetoDevuelto[];
  
  observaciones?: string;
  incidencias: Incidencia[];
  duracion: number; // minutos
}

/**
 * Objeto devuelto en requisa de salida
 */
export interface ObjetoDevuelto {
  objeto: string;
  cantidad: number;
  recibio: string;
}

/**
 * DTO para completar requisa de entrada
 */
export interface CompletarRequisaEntradaDTO {
  visitaId: string;
  resultado: ResultadoRequisa;
  detectorMetales: boolean;
  revisionVisual: boolean;
  revisionBolsos: boolean;
  revisionCorporal: boolean;
  objetosDecomisados: ObjetoDecomisado[];
  observaciones?: string;
}

/**
 * DTO para completar requisa de salida
 */
export interface CompletarRequisaSalidaDTO {
  visitaId: string;
  revisionVisual: boolean;
  revisionBolsos: boolean;
  objetosDevueltos: ObjetoDevuelto[];
  observaciones?: string;
}

/**
 * Checklist de requisa de entrada
 */
export interface ChecklistRequisaEntrada {
  detectorMetales: boolean;
  revisionVisual: boolean;
  revisionBolsos: boolean;
  revisionCorporal: boolean;
}

/**
 * Checklist de requisa de salida
 */
export interface ChecklistRequisaSalida {
  revisionVisual: boolean;
  revisionBolsos: boolean;
}