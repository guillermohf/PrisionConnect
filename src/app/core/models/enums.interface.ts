// src/app/core/models/enums.interface.ts

/**
 * Roles de usuario en el sistema
 */
export enum RolUsuario {
  SUPER_ADMINISTRADOR = 'SuperAdministrador',
  SUPERVISOR = 'Supervisor',
  DATA_ENTRY = 'Data Entry',
  SEGURIDAD_RECEPCION = 'Seguridad de Recepción',
  SEGURIDAD_REQUISA = 'Seguridad de Requisa'
}

/**
 * Situación legal del recluso
 */
export enum SituacionLegal {
  CONDENADO = 'Condenado',
  PROCESADO = 'Procesado',
  PRISION_PREVENTIVA = 'Prisión Preventiva'
}

/**
 * Estado del recluso en el sistema
 */
export enum EstadoRecluso {
  ACTIVO = 'Activo',                    // Recluido actualmente
  LIBERTAD_CONDICIONAL = 'Libertad Condicional',
  TRASLADADO = 'Trasladado',           // Trasladado a otra institución
  FUGADO = 'Fugado',
  FALLECIDO = 'Fallecido',
  LIBERADO = 'Liberado'                // Cumplió condena
}

/**
 * Tipo de abogado
 */
export enum TipoAbogado {
  PUBLICO = 'Público',
  PRIVADO = 'Privado'
}

/**
 * Tipo de visita
 */
export enum TipoVisita {
  FAMILIAR = 'Familiar',
  LEGAL = 'Legal',
  AMISTADES = 'Amistades',
  CONYUGAL = 'Conyugal'
}

/**
 * Estados posibles de una visita
 */
export enum EstadoVisita {
  REGISTRADA = 'Registrada',
  EN_REQUISA_ENTRADA = 'En Requisa Entrada',
  RECHAZADA_EN_REQUISA = 'Rechazada en Requisa',
  EN_TRANSITO = 'En Tránsito',
  EN_CURSO = 'En Curso',
  PENDIENTE_REQUISA_SALIDA = 'Pendiente Requisa Salida',
  FINALIZADA = 'Finalizada',
  CANCELADA = 'Cancelada'
}

/**
 * Resultado de una requisa
 */
export enum ResultadoRequisa {
  APROBADA = 'Aprobada',
  RECHAZADA = 'Rechazada',
  PENDIENTE = 'Pendiente'
}

/**
 * Tipo de caso legal
 */
export enum TipoCaso {
  PENAL = 'Penal',
  CIVIL = 'Civil',
  APELACION = 'Apelación',
  REVISION = 'Revisión'
}

/**
 * Estado de un caso legal
 */
export enum EstadoCaso {
  ACTIVO = 'Activo',
  CERRADO = 'Cerrado',
  SUSPENDIDO = 'Suspendido'
}

/**
 * Parentesco entre visitante y recluso
 */
export enum Parentesco {
  PADRE = 'Padre',
  MADRE = 'Madre',
  HIJO = 'Hijo',
  HIJA = 'Hija',
  HERMANO = 'Hermano',
  HERMANA = 'Hermana',
  CONYUGE = 'Cónyuge',
  PAREJA = 'Pareja',
  ABUELO = 'Abuelo',
  ABUELA = 'Abuela',
  TIO = 'Tío',
  TIA = 'Tía',
  PRIMO = 'Primo',
  PRIMA = 'Prima',
  AMIGO = 'Amigo',
  AMIGA = 'Amiga',
  OTRO = 'Otro'
}

/**
 * Tipo de incidencia
 */
export enum TipoIncidencia {
  RETRASO = 'Retraso',
  COMPORTAMIENTO_INADECUADO = 'Comportamiento inadecuado',
  INTENTO_INGRESO_PROHIBIDO = 'Intento de ingreso de objetos prohibidos',
  VISITA_EXTENDIDA = 'Visita extendida',
  CAMBIO_AREA = 'Cambio de área',
  OTRO = 'Otro'
}

/**
 * Gravedad de una incidencia
 */
export enum GravedadIncidencia {
  LEVE = 'Leve',
  MODERADA = 'Moderada',
  GRAVE = 'Grave'
}

/**
 * Proveedor de autenticación
 */
export enum ProviderAuth {
  GOOGLE = 'google',
  EMAIL = 'email'
}

export enum EstadoCivil {
  SOLTERO = 'Soltero',
  CASADO = 'Casado',
  UNION_LIBRE = 'Unión Libre',
  DIVORCIADO = 'Divorciado',
  VIUDO = 'Viudo'
}