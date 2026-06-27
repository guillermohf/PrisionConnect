// src/app/core/services/usuarios.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collection, getDocs, query, orderBy, doc, updateDoc, Timestamp, setDoc } from '@angular/fire/firestore';
import { Usuario, ActualizarRolDTO, CambiarEstadoUsuarioDTO } from '@core/models/usuario.interface';
import { RolUsuario } from '@core/models/enums.interface';
import { AuditService } from './audit.service';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private firestore = inject(Firestore);
  private auditService = inject(AuditService);
  private usuariosCollection = collection(this.firestore, 'usuarios');

  // Signals Reactivos
  usuarios = signal<Usuario[]>([]);
  loading = signal(false);

  constructor() {
    this.cargarUsuarios();
  }

  async cargarUsuarios(): Promise<void> {
    this.loading.set(true);
    try {
      const q = query(this.usuariosCollection, orderBy('fechaCreacion', 'desc'));
      const snap = await getDocs(q);
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() } as Usuario));
      this.usuarios.set(lista);
    } catch (error) {
      console.error('Error al cargar la lista de usuarios:', error);
    } finally {
      this.loading.set(false);
    }
  }

  // ==========================================
  // LÓGICA DE ESTADÍSTICAS Y FILTROS
  // ==========================================

  obtenerEstadisticas() {
    const todos = this.usuarios();
    return {
      total: todos.length,
      activos: todos.filter(u => u.activo).length,
      inactivos: todos.filter(u => !u.activo).length,
      porRol: {
        superAdmin: todos.filter(u => u.rol === RolUsuario.SUPER_ADMINISTRADOR).length,
        supervisor: todos.filter(u => u.rol === RolUsuario.SUPERVISOR).length,
        dataEntry: todos.filter(u => u.rol === RolUsuario.DATA_ENTRY).length,
        recepcion: todos.filter(u => u.rol === RolUsuario.SEGURIDAD_RECEPCION).length,
        requisa: todos.filter(u => u.rol === RolUsuario.SEGURIDAD_REQUISA).length
      }
    };
  }

  obtenerUsuariosFiltrados(filtros: { busqueda?: string; rol?: RolUsuario; activo?: boolean }): Usuario[] {
    let resultado = this.usuarios();

    if (filtros.busqueda) {
      const b = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(u => 
        u.nombreCompleto?.toLowerCase().includes(b) || 
        u.email.toLowerCase().includes(b)
      );
    }
    if (filtros.rol) resultado = resultado.filter(u => u.rol === filtros.rol);
    if (filtros.activo !== undefined) resultado = resultado.filter(u => u.activo === filtros.activo);

    return resultado;
  }

  // ==========================================
  // ACCIONES DIRECTAS A FIRESTORE (PARA TESIS)
  // ==========================================

  async actualizarPerfil(userId: string, datos: Partial<Usuario>): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);
      const userRef = doc(this.firestore, `usuarios/${userId}`);
      await updateDoc(userRef, { 
        ...datos, 
        fechaActualizacion: Timestamp.now() 
      });
      await this.cargarUsuarios();
      await this.auditService.registrarAccion(
        'Usuarios', 'ACTUALIZAR_PERFIL',
        `Perfil actualizado para usuario: ${userId}`,
        'INFO'
      );
      return { success: true, message: 'Perfil actualizado exitosamente' };
    } catch (error: any) {
      await this.auditService.registrarAccion('Usuarios', 'ERROR_ACTUALIZAR_PERFIL', `Error al actualizar perfil de ${userId}: ${error.message}`, 'ERROR');
      return { success: false, message: 'Error al actualizar perfil' };
    } finally {
      this.loading.set(false);
    }
  }

  async crearNuevoUsuarioDirecto(datos: any): Promise<{ success: boolean; message: string }> {
    this.loading.set(true);
    try {
      const userId = datos.email.replace(/\./g, '_'); 
      const userRef = doc(this.firestore, `usuarios/${userId}`);

      const nuevoUsuario: Usuario = {
        email: datos.email,
        nombre: datos.nombre,
        apellido: datos.apellido,
        nombreCompleto: `${datos.nombre} ${datos.apellido}`.trim(),
        rol: datos.rol,
        cedula: datos.cedula,
        departamento: datos.departamento,
        activo: true,
        provider: 'correo' as any,
        fechaCreacion: Timestamp.now(),
        ultimoAcceso: null,
        avatar: ''
      };

      await setDoc(userRef, nuevoUsuario);
      await this.cargarUsuarios(); 
      await this.auditService.registrarAccion(
        'Usuarios', 'CREAR_USUARIO',
        `Nuevo usuario creado: ${nuevoUsuario.nombreCompleto} (${nuevoUsuario.email}) - Rol: ${nuevoUsuario.rol}`,
        'INFO'
      );
      return { success: true, message: 'Usuario registrado en Firestore' };
    } catch (error: any) {
      await this.auditService.registrarAccion('Usuarios', 'ERROR_CREAR_USUARIO', `Error al crear usuario ${datos.email}: ${error.message}`, 'ERROR');
      return { success: false, message: 'Error de escritura' };
    } finally {
      this.loading.set(false);
    }
  }

  async cambiarRol(datos: ActualizarRolDTO): Promise<{ success: boolean; message: string }> {
    this.loading.set(true);
    try {
      const userRef = doc(this.firestore, `usuarios/${datos.usuarioId}`);
      await updateDoc(userRef, { rol: datos.nuevoRol });
      await this.cargarUsuarios();
      await this.auditService.registrarAccion(
        'Usuarios', 'CAMBIAR_ROL',
        `Rol cambiado a "${datos.nuevoRol}" para usuario: ${datos.usuarioId}`,
        'WARNING'
      );
      return { success: true, message: 'Rol actualizado directamente en Firestore' };
    } catch (error: any) {
      await this.auditService.registrarAccion('Usuarios', 'ERROR_CAMBIAR_ROL', `Error al cambiar rol de ${datos.usuarioId}: ${error.message}`, 'ERROR');
      return { success: false, message: 'Error al cambiar rol' };
    } finally {
      this.loading.set(false);
    }
  }

  async cambiarEstado(datos: CambiarEstadoUsuarioDTO): Promise<{ success: boolean; message: string }> {
    this.loading.set(true);
    try {
      const userRef = doc(this.firestore, `usuarios/${datos.usuarioId}`);
      await updateDoc(userRef, { activo: datos.activo });
      await this.cargarUsuarios();
      await this.auditService.registrarAccion(
        'Usuarios', datos.activo ? 'ACTIVAR_USUARIO' : 'DESACTIVAR_USUARIO',
        `Usuario ${datos.activo ? 'activado' : 'desactivado'}: ${datos.usuarioId}`,
        'WARNING'
      );
      return { success: true, message: datos.activo ? 'Usuario activado' : 'Usuario desactivado' };
    } catch (error: any) {
      await this.auditService.registrarAccion('Usuarios', 'ERROR_CAMBIAR_ESTADO_USUARIO', `Error al cambiar estado de ${datos.usuarioId}: ${error.message}`, 'ERROR');
      return { success: false, message: 'Error al actualizar estado' };
    } finally {
      this.loading.set(false);
    }
  }

  // ==========================================
  // HELPERS DE UI
  // ==========================================

  obtenerNombreRol(rol: RolUsuario): string {
    const nombres: Record<RolUsuario, string> = {
      [RolUsuario.SUPER_ADMINISTRADOR]: 'Super Administrador',
      [RolUsuario.SUPERVISOR]: 'Supervisor',
      [RolUsuario.DATA_ENTRY]: 'Data Entry',
      [RolUsuario.SEGURIDAD_RECEPCION]: 'Seguridad Recepción',
      [RolUsuario.SEGURIDAD_REQUISA]: 'Seguridad Requisa'
    };
    return nombres[rol] || rol;
  }

  obtenerColorRol(rol: RolUsuario): string {
    const colores: Record<RolUsuario, string> = {
      [RolUsuario.SUPER_ADMINISTRADOR]: 'bg-red-100 text-red-800 border-red-200',
      [RolUsuario.SUPERVISOR]: 'bg-purple-100 text-purple-800 border-purple-200',
      [RolUsuario.DATA_ENTRY]: 'bg-blue-100 text-blue-800 border-blue-200',
      [RolUsuario.SEGURIDAD_RECEPCION]: 'bg-green-100 text-green-800 border-green-200',
      [RolUsuario.SEGURIDAD_REQUISA]: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colores[rol] || 'bg-gray-100 text-gray-800 border-gray-200';
  }
}