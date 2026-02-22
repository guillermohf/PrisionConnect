// src/app/core/models/index.ts

/**
 * Barrel file para exportar todas las interfaces y tipos del sistema
 * 
 * Uso:
 * import { Usuario, Recluso, RolUsuario } from '@core/models';
 */

// Enums
export * from './enums.interface';

// Interfaces principales
export * from './usuario.interface';
export * from './recluso.interface';
export * from './visitante.interface';
export * from './abogado.interface';
export * from './relacion.interface';
export * from './visitas.interface';
export * from './requisa.interface';
export * from './configuracion.interface';

// Reportes

// Auxiliares
export * from './auxiliar.interface';

// Utilidades
export * from './utils';

// Type Guards
export * from './type-guards';