import { Component, EventEmitter, Input, Output, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuariosService } from '@core/services/usuarios.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { Usuario } from '@core/models/usuario.interface';
import { RolUsuario } from '@core/models/enums.interface';
// 👇 Asegúrate de que esta ruta apunte a tu modal genérico
import { ModalComponent } from '@shared/modal/modal.component'; 

@Component({
  selector: 'prisionConnect-cambiar-rol-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './cambiar-rol-modal.component.html'
})
export class CambiarRolModalComponent implements OnChanges {
  // Inputs del componente Padre
  @Input() isOpen = false;
  @Input() usuario: Usuario | null = null;
  
  // Outputs hacia el componente Padre
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() actualizado = new EventEmitter<void>();

  // Servicios inyectados
  private usuariosService = inject(UsuariosService);
  private notificacionService = inject(NotificacionService);

  // Variables de estado
  guardando = false;
  nuevoRol: RolUsuario | null = null;

  // Lista de configuración para el HTML
  rolesDisponibles = [
    { 
      valor: RolUsuario.SUPER_ADMINISTRADOR, 
      nombre: 'Super Administrador',
      descripcion: 'Control total del sistema',
      color: 'bg-teal-50 text-teal-900 border-teal-600' // Ajustado al HTML
    },
    { 
      valor: RolUsuario.SUPERVISOR, 
      nombre: 'Supervisor',
      descripcion: 'Ver todos los módulos y generar reportes',
      color: 'bg-teal-50 text-teal-900 border-teal-600'
    },
    { 
      valor: RolUsuario.DATA_ENTRY, 
      nombre: 'Data Entry',
      descripcion: 'Crear y editar datos maestros',
      color: 'bg-teal-50 text-teal-900 border-teal-600'
    },
    { 
      valor: RolUsuario.SEGURIDAD_RECEPCION, 
      nombre: 'Seguridad de Recepción',
      descripcion: 'Registrar visitas y check-in/out',
      color: 'bg-teal-50 text-teal-900 border-teal-600'
    },
    { 
      valor: RolUsuario.SEGURIDAD_REQUISA, 
      nombre: 'Seguridad de Requisa',
      descripcion: 'Realizar requisas y control de objetos',
      color: 'bg-teal-50 text-teal-900 border-teal-600'
    }
  ];

  // Sincroniza el radio button con el rol actual cuando se abre el modal
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      this.nuevoRol = this.usuario.rol;
    }
  }

  // Método disparado por el HTML: (click)="seleccionarRol(rol.valor)"
  seleccionarRol(rol: RolUsuario): void {
    this.nuevoRol = rol;
  }

  // Método disparado por el HTML: (click)="guardar()"
  async guardar(): Promise<void> {
    if (!this.nuevoRol || !this.usuario?.id) {
      this.notificacionService.error('Debes seleccionar un rol');
      return;
    }

    if (this.nuevoRol === this.usuario.rol) {
      this.notificacionService.error('El usuario ya tiene este rol');
      return;
    }

    this.guardando = true;

    try {
      const resultado = await this.usuariosService.cambiarRol({
        usuarioId: this.usuario.id,
        nuevoRol: this.nuevoRol
      });

      if (resultado.success) {
        // Notificamos al padre para que refresque la tabla
        this.actualizado.emit(); 
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error al comunicarse con el servidor.');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  // Método disparado por el HTML: (click)="cerrar()"
  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    
    // Resetear al estado inicial para la próxima vez que se abra
    if (this.usuario) {
      this.nuevoRol = this.usuario.rol;
    }
  }

  // Helpers para el HTML
  obtenerNombreRol(rol: RolUsuario): string {
    return this.usuariosService.obtenerNombreRol(rol);
  }

  obtenerColorRolActual(): string {
    return this.usuario ? this.usuariosService.obtenerColorRol(this.usuario.rol) : '';
  }
}