export type AuditLogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditLog {
  id?: string;
  accion: string; // Ej: "Eliminación de recluso", "Modificación de visita"
  modulo: string; // Ej: "Reclusos", "Recepción", "Requisa", "Usuarios", "Configuración"
  usuarioId: string;
  usuarioNombre: string;
  rolUsuario: string;
  detalles: string; // Detalles en texto o JSON stringificado de lo ocurrido
  fecha: any; // Timestamp de Firebase
  nivel: AuditLogLevel;
  ip?: string; // Opcional, si se quiere rastrear
}
