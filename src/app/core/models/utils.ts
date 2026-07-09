// src/app/core/models/utils.ts

import { Timestamp } from 'firebase/firestore';

/**
 * Convierte Timestamp de Firestore a Date
 */
export function timestampToDate(timestamp: Timestamp | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
}

/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export function calcularEdad(fechaNacimiento: Date | Timestamp): number {
  const fecha = timestampToDate(fechaNacimiento);
  if (!fecha) return 0;
  
  const hoy = new Date();
  let edad = hoy.getFullYear() - fecha.getFullYear();
  const mes = hoy.getMonth() - fecha.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
    edad--;
  }
  
  return edad;
}

/**
 * Formatea duración en minutos a string legible
 */
export function formatearDuracion(minutos: number): string {
  if (minutos < 60) {
    return `${minutos}m`;
  }
  
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
}

/**
 * Obtiene el nombre completo de una persona
 */
export function getNombreCompleto(nombre: string, apellido: string): string {
  return `${nombre} ${apellido}`.trim();
}

/**
 * Valida formato de cédula dominicana.
 * Acepta tanto XXX-XXXXXXX-X como 11 dígitos puros (sin guiones).
 */
export function validarCedula(cedula: string | null | undefined): boolean {
  if (!cedula) return false;
  const soloDigitos = cedula.replace(/\D/g, '');
  if (soloDigitos.length === 11) return true;
  const regex = /^\d{3}-\d{7}-\d{1}$/;
  return regex.test(cedula);
}

/**
 * Valida formato de exequátur (EX-XXXXX)
 */
export function validarExequatur(exequatur: string): boolean {
  const regex = /^EX-\d{5,10}$/;
  return regex.test(exequatur);
}

/**
 * Valida formato de email
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida formato de teléfono dominicano
 */
export function validarTelefono(telefono: string): boolean {
  // Formato: 809-XXX-XXXX o 8095551234
  const regex = /^(809|829|849)-?\d{3}-?\d{4}$/;
  return regex.test(telefono);
}

/**
 * Formatea cédula agregando guiones si no los tiene
 */
export function formatearCedula(cedula: string): string {
  // Remove all non-digit characters
  const digits = cedula.replace(/\D/g, '');
  
  // Format as XXX-XXXXXXX-X
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
  }
  
  return cedula;
}

/**
 * Formatea teléfono agregando guiones si no los tiene
 */
export function formatearTelefono(telefono: string): string {
  // Remove all non-digit characters
  const digits = telefono.replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  return telefono;
}

/**
 * Genera un ID único simple
 */
export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Formatea fecha a string legible
 */
export function formatearFecha(fecha: Date | Timestamp, formato: 'corto' | 'largo' = 'corto'): string {
  const date = timestampToDate(fecha);
  if (!date) return '';
  
  if (formato === 'corto') {
    return date.toLocaleDateString('es-DO', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }
  
  return date.toLocaleDateString('es-DO', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Formatea hora a string
 */
export function formatearHora(fecha: Date | Timestamp): string {
  const date = timestampToDate(fecha);
  if (!date) return '';
  
  return date.toLocaleTimeString('es-DO', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calcula diferencia en minutos entre dos fechas
 */
export function diferenciaEnMinutos(fecha1: Date | Timestamp, fecha2: Date | Timestamp): number {
  const d1 = timestampToDate(fecha1);
  const d2 = timestampToDate(fecha2);
  
  if (!d1 || !d2) return 0;
  
  return Math.floor((d2.getTime() - d1.getTime()) / 60000);
}

/**
 * Verifica si una fecha es hoy
 */
export function esHoy(fecha: Date | Timestamp): boolean {
  const date = timestampToDate(fecha);
  if (!date) return false;
  
  const hoy = new Date();
  return date.toDateString() === hoy.toDateString();
}

/**
 * Obtiene el inicio del día
 */
export function inicioDia(fecha: Date = new Date()): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Obtiene el fin del día
 */
export function finDia(fecha: Date = new Date()): Date {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Capitaliza primera letra de cada palabra
 */
export function capitalize(texto: string): string {
  return texto
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Trunca texto a longitud máxima
 */
export function truncar(texto: string, longitud: number = 50): string {
  if (texto.length <= longitud) return texto;
  return texto.slice(0, longitud) + '...';
}

/**
 * Remueve acentos de un string
 */
export function removerAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca coincidencias en texto (sin acentos, case insensitive)
 */
export function buscarEnTexto(texto: string, busqueda: string): boolean {
  const textoNormalizado = removerAcentos(texto.toLowerCase());
  const busquedaNormalizada = removerAcentos(busqueda.toLowerCase());
  return textoNormalizado.includes(busquedaNormalizada);
}