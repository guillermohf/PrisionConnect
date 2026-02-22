// src/app/core/models/reporte.interface.ts

import { TipoIncidencia } from './enums.interface';

/**
 * Estadísticas del dashboard
 */
export interface EstadisticasDashboard {
  totalReclusos: number;
  reclusosActivos: number;
  totalVisitantes: number;
  totalAbogados: number;
  visitasHoy: number;
  visitasEnCurso: number;
  visitasPendientesRequisa: number;
  visitasMes: number;
}

/**
 * Reporte de visitas
 */
export interface ReporteVisitas {
  fecha: Date;
  totalVisitas: number;
  visitasFamiliares: number;
  visitasLegales: number;
  visitasAprobadas: number;
  visitasRechazadas: number;
  duracionPromedio: number;
  visitasPorPabellon: { [pabellon: string]: number };
  visitantesMasActivos: VisitanteStats[];
  reclusosMasVisitados: ReclusoStats[];
}

/**
 * Estadísticas de visitante
 */
export interface VisitanteStats {
  visitanteId: string;
  nombreCompleto: string;
  totalVisitas: number;
}

/**
 * Estadísticas de recluso
 */
export interface ReclusoStats {
  reclusoId: string;
  nombreCompleto: string;
  totalVisitas: number;
  pabellon: string;
}

/**
 * Reporte de requisa
 */
export interface ReporteRequisa {
  fecha: Date;
  totalRequisas: number;
  aprobadas: number;
  rechazadas: number;
  objetosDecomisados: number;
  tiempoPromedioEntrada: number;
  tiempoPromedioSalida: number;
  detallesObjetos: DetallesObjetos;
  incidencias: IncidenciaStats[];
}

/**
 * Detalles de objetos decomisados
 */
export interface DetallesObjetos {
  celulares: number;
  dinero: number;
  llaves: number;
  otros: number;
}

/**
 * Estadísticas de incidencias
 */
export interface IncidenciaStats {
  tipo: TipoIncidencia;
  cantidad: number;
}

/**
 * Filtros para reportes de visitas
 */
export interface FiltrosReporteVisitas {
  fechaInicio: Date;
  fechaFin: Date;
  pabellon?: string;
  tipo?: 'Familiar' | 'Legal';
}

/**
 * Filtros para reportes de requisa
 */
export interface FiltrosReporteRequisa {
  fechaInicio: Date;
  fechaFin: Date;
  tipoObjeto?: string;
}

/**
 * Reporte mensual
 */
export interface ReporteMensual {
  mes: number;
  año: number;
  totalVisitas: number;
  visitasPromedioDiario: number;
  reclusosMasVisitados: ReclusoStats[];
  diasMasActivos: DiaActivoStats[];
}

/**
 * Estadísticas de día activo
 */
export interface DiaActivoStats {
  fecha: Date;
  totalVisitas: number;
}

/**
 * Reporte anual
 */
export interface ReporteAnual {
  año: number;
  totalVisitas: number;
  visitasPorMes: number[];
  crecimientoAnual: number; // porcentaje
  mesConMasVisitas: number;
  mesConMenosVisitas: number;
}