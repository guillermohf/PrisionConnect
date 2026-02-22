// src/app/core/models/type-guards.ts

import { 
  Visita, 
  RequisaEntrada, 
  RequisaSalida 
} from './visitas.interface';
import { 
  TipoVisita, 
  EstadoVisita, 
  ResultadoRequisa 
} from './enums.interface';

/**
 * Verifica si una visita es de tipo familiar
 */
export function esVisitaFamiliar(visita: Visita): boolean {
  return visita.tipo === TipoVisita.FAMILIAR;
}

/**
 * Verifica si una visita es de tipo legal
 */
export function esVisitaLegal(visita: Visita): boolean {
  return visita.tipo === TipoVisita.LEGAL;
}

/**
 * Verifica si una visita está en curso
 */
export function visitaEnCurso(visita: Visita): boolean {
  return visita.estado === EstadoVisita.EN_CURSO;
}

/**
 * Verifica si una visita está finalizada
 */
export function visitaFinalizada(visita: Visita): boolean {
  return visita.estado === EstadoVisita.FINALIZADA;
}

/**
 * Verifica si una visita está pendiente de requisa
 */
export function visitaPendienteRequisa(visita: Visita): boolean {
  return visita.estado === EstadoVisita.REGISTRADA ||
         visita.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA;
}

/**
 * Verifica si una visita está pendiente de requisa de entrada
 */
export function visitaPendienteRequisaEntrada(visita: Visita): boolean {
  return visita.estado === EstadoVisita.REGISTRADA;
}

/**
 * Verifica si una visita está pendiente de requisa de salida
 */
export function visitaPendienteRequisaSalida(visita: Visita): boolean {
  return visita.estado === EstadoVisita.PENDIENTE_REQUISA_SALIDA;
}

/**
 * Verifica si una visita fue rechazada en requisa
 */
export function visitaRechazada(visita: Visita): boolean {
  return visita.estado === EstadoVisita.RECHAZADA_EN_REQUISA;
}

/**
 * Verifica si una requisa fue aprobada
 */
export function requisaAprobada(requisa: RequisaEntrada | RequisaSalida | undefined): boolean {
  if (!requisa) return false;
  return requisa.resultado === ResultadoRequisa.APROBADA;
}

/**
 * Verifica si una requisa fue rechazada
 */
export function requisaRechazada(requisa: RequisaEntrada | RequisaSalida | undefined): boolean {
  if (!requisa) return false;
  return requisa.resultado === ResultadoRequisa.RECHAZADA;
}

/**
 * Verifica si una visita tiene visitantes presentes
 */
export function tieneVisitantesPresentes(visita: Visita): boolean {
  return visita.visitantesPresentes > 0;
}

/**
 * Verifica si una visita tiene objetos decomisados
 */
export function tieneObjetosDecomisados(visita: Visita): boolean {
  return (visita.requisaEntrada?.objetosDecomisados?.length ?? 0) > 0;
}

/**
 * Verifica si una visita tiene incidencias
 */
export function tieneIncidencias(visita: Visita): boolean {
  return visita.incidencias.length > 0;
}

/**
 * Verifica si todos los visitantes de una visita están presentes
 */
export function todosVisitantesPresentes(visita: Visita): boolean {
  return visita.totalVisitantes === visita.visitantesPresentes;
}

/**
 * Verifica si una visita puede ser cancelada
 */
export function puedeCancelarVisita(visita: Visita): boolean {
  return visita.estado === EstadoVisita.REGISTRADA || 
         visita.estado === EstadoVisita.EN_REQUISA_ENTRADA;
}

/**
 * Verifica si una visita puede hacer check-in
 */
export function puedeHacerCheckIn(visita: Visita): boolean {
  return visita.estado === EstadoVisita.EN_TRANSITO;
}

/**
 * Verifica si una visita puede hacer check-out
 */
export function puedeHacerCheckOut(visita: Visita): boolean {
  return visita.estado === EstadoVisita.EN_CURSO;
}

/**
 * Verifica si se debe mostrar alerta de tiempo
 */
export function debeAlertar(visita: Visita, tiempoAdvertencia: number): boolean {
  if (!visita.checkInPrincipal || !visita.duracionTotal) return false;
  
  const duracionMaxima = 60; // Puedes obtener esto de configuración
  const tiempoRestante = duracionMaxima - visita.duracionTotal;
  
  return tiempoRestante <= tiempoAdvertencia && tiempoRestante > 0;
}