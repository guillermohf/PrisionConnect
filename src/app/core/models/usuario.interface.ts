// src/app/core/models/usuario.interface.ts

import { Timestamp } from 'firebase/firestore';
import { RolUsuario, ProviderAuth } from './enums.interface';

/**
 * Interface para Usuario del sistema
 */
export interface Usuario {
  id?: string;
  email: string;
  nombre: string;
  apellido: string;
  nombreCompleto?: string;
  cedula: string;
  departamento: string;
  rol: RolUsuario;
  activo: boolean;
  fechaCreacion: Timestamp | Date;
  ultimoAcceso: Timestamp | Date | null;
  avatar?: string;
  provider: ProviderAuth;
}

/**
 * DTO para actualizar perfil de usuario
 */
export interface ActualizarPerfilDTO {
  nombre?: string;
  apellido?: string;
  avatar?: string;
}

/**
 * DTO para actualizar rol de usuario (solo admin)
 */
export interface ActualizarRolDTO {
  usuarioId: string;
  nuevoRol: RolUsuario;
}

/**
 * DTO para activar/desactivar usuario
 */
export interface CambiarEstadoUsuarioDTO {
  usuarioId: string;
  activo: boolean;
}