// src/app/pages/usuarios/usuarios.component.ts

import { Component, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '@core/services/usuarios.service';
import { AuthService } from '@core/services/auth.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Usuario } from '@core/models/usuario.interface';
import { RolUsuario } from '@core/models/enums.interface';

// Componentes
import { UsuarioDetalleModalComponent } from './modal/usuarios-detalle-modal/usuarios-detalle-modal.component';
import { CambiarRolModalComponent } from './modal/cambiar-rol-modal/cambiar-rol-modal.component';
import { CambiarEstadoModalComponent } from './modal/cambiar-estado-modal/cambiar-estado-modal.component';
import { UsuariosAgregarModalComponent } from "./modal/usuarios-agregar-modal/usuarios-agregar-modal.component";
import { DataTableComponent } from "@shared/datatable/datatable.component";

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // ✅ Usamos tu componente compartido
    DataTableComponent,
    UsuarioDetalleModalComponent,
    UsuariosAgregarModalComponent,
    CambiarEstadoModalComponent,
    CambiarRolModalComponent
],
  templateUrl: './usuarios.component.html'
})
export default class UsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);

  RolUsuario = RolUsuario;

  // Signals
  usuarios = this.usuariosService.usuarios;
  loading = this.usuariosService.loading;
  estadisticas = computed(() => this.usuariosService.obtenerEstadisticas());
  
  verificandoPermisos = false; // Sin validación para tesis
  tieneAcceso = true;

  filtros = { busqueda: '', rol: undefined, activo: undefined };
  usuariosFiltrados: Usuario[] = [];

  // Modales
  mostrarModalAgregar = false;
  mostrarModalDetalle = false;
  mostrarModalCambiarRol = false;
  mostrarModalCambiarEstado = false;
  usuarioSeleccionado: Usuario | null = null;

  // ⭐ Columnas adaptadas para el DataTableComponent
  columnas = [
    { key: 'nombreCompleto', label: 'Nombre Completo' },
    { key: 'email', label: 'Correo Electrónico' },
    { key: 'rol', label: 'Nivel de Acceso' },
    { key: 'activo', label: 'Estado' } // El DataTable lo detecta y pone el Badge solo
  ];

  constructor() {
    effect(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit(): void {
    this.usuariosService.cargarUsuarios();
  }

  aplicarFiltros(): void {
    this.usuariosFiltrados = this.usuariosService.obtenerUsuariosFiltrados(this.filtros);
  }

  limpiarFiltros(): void {
    this.filtros = { busqueda: '', rol: undefined, activo: undefined };
    this.aplicarFiltros();
  }

  // --- Handlers de la Tabla ---
  
  onVerDetalle(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.mostrarModalDetalle = true;
  }

  onCambiarEstado(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.mostrarModalCambiarEstado = true;
  }

  // --- Otros Métodos ---
  abrirModalAgregar() { this.mostrarModalAgregar = true; }
  
  onUsuarioAgregado() { this.aplicarFiltros(); }

  onAccionCompletada(msj: string) {
    this.notificacionService.success(msj);
    this.aplicarFiltros();
  }
}