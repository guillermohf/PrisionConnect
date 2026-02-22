// FUNCIÓN PARA AGREGAR AL COMPONENT
// src/app/features/reclusos/components/recluso-agregar-modal/recluso-agregar-modal.component.ts

import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Timestamp } from '@angular/fire/firestore';
import { ReclusosService } from '@core/services/reclusos.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { SituacionLegal, EstadoCivil, EstadoRecluso } from '@core/models/enums.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { CedulaMaskDirective } from "@shared/directives/cedula-mask.directive";
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";
import { cedulaDominicanaValidator, telefonoDominicanoValidator } from '@shared/validators/custom.validators';
import { InputComponent } from '@shared/input/input.component';
import { ButtonComponent } from "@shared/button/buttton.component";

@Component({
  selector: 'prisionConnect-recluso-agregar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    CedulaMaskDirective,
    TelefonoMaskDirective,
    InputComponent,
    ButtonComponent
  ],
  templateUrl: './reclusos-agregar-modal.component.html'
})
export class ReclusoAgregarModalComponent implements OnInit {  // ✅ AGREGAR OnInit
  @Input() showModal = false;
  @Output() showModalChange = new EventEmitter<boolean>();
  @Output() reclusoAgregado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private reclusosService = inject(ReclusosService);
  private notificacionService = inject(NotificacionService);

  form: FormGroup;
  guardando = false;
  generandoId = false;  // ✅ NUEVO

  // Enums para el template
  SituacionLegal = SituacionLegal;
  EstadoRecluso = EstadoRecluso;
  EstadoCivil = EstadoCivil;

  constructor() {
    this.form = this.fb.group({
      // Identificación
      numeroIdentificacion: [{ value: '', disabled: true }, Validators.required],  // ✅ DISABLED
      numeroExpediente: [''],
      cedula: ['', [Validators.required, cedulaDominicanaValidator()]],
      
      // Información Personal
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      sexo: ['', Validators.required],
      nacionalidad: ['', Validators.required],
      estadoCivil: [''],
      
      // Contacto
      direccion: ['', Validators.required],
      telefono: ['', telefonoDominicanoValidator()],
      nombreContactoEmergencia: ['', Validators.required],
      telefonoEmergencia: ['', telefonoDominicanoValidator()],
      
      // Ubicación
      pabellon: ['', Validators.required],
      celda: ['', Validators.required],
      
      // Información Penal
      fechaIngreso: ['', Validators.required],
      situacionLegal: ['', Validators.required],
      estado: ['', Validators.required],
      delito: [''],
      sentencia: [''],
      
      // Otros
      observaciones: ['']
    });
  }

  // ✅ NUEVO: ngOnInit para generar ID al abrir modal
  ngOnInit(): void {
    if (this.showModal) {
      this.generarNumeroIdentificacion();
    }
  }

  // ========================================
  // ✅ NUEVA FUNCIÓN: Generar ID Automático
  // ========================================
  async generarNumeroIdentificacion(): Promise<void> {
    this.generandoId = true;

    try {
      // Obtener el año actual
      const anioActual = new Date().getFullYear();

      // Obtener todos los reclusos del año actual
      const reclusosActuales = this.reclusosService.reclusos();
      
      // Filtrar reclusos del año actual
      const reclusosDelAnio = reclusosActuales.filter(r => {
        if (!r.numeroIdentificacion) return false;
        return r.numeroIdentificacion.startsWith(`R-${anioActual}`);
      });

      // Calcular el siguiente número secuencial
      let siguienteNumero = 1;
      
      if (reclusosDelAnio.length > 0) {
        // Extraer números existentes y encontrar el máximo
        const numeros = reclusosDelAnio
          .map(r => {
            const match = r.numeroIdentificacion?.match(/R-\d{4}-(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(n => !isNaN(n));

        siguienteNumero = Math.max(...numeros, 0) + 1;
      }

      // Formatear con ceros a la izquierda (4 dígitos)
      const numeroFormateado = siguienteNumero.toString().padStart(4, '0');
      
      // Generar el ID final: R-YYYY-NNNN
      const numeroIdentificacion = `R-${anioActual}-${numeroFormateado}`;

      // Actualizar el formulario
      this.form.patchValue({ 
        numeroIdentificacion 
      });

      console.log('✅ Número de identificación generado:', numeroIdentificacion);

    } catch (error) {
      console.error('Error generando número de identificación:', error);
      
      // Fallback: usar timestamp
      const timestamp = Date.now().toString().slice(-6);
      const numeroIdentificacion = `R-${new Date().getFullYear()}-${timestamp}`;
      
      this.form.patchValue({ 
        numeroIdentificacion 
      });
      
      this.notificacionService.warning('ID generado con método alternativo');
    } finally {
      this.generandoId = false;
    }
  }

  // ========================================
  // MÉTODOS EXISTENTES (sin cambios)
  // ========================================

  aplicarMascaraCedula(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 11) valor = valor.substring(0, 11);
    if (valor.length >= 3) valor = valor.substring(0, 3) + '-' + valor.substring(3);
    if (valor.length >= 11) valor = valor.substring(0, 11) + '-' + valor.substring(11);
    this.form.patchValue({ cedula: valor }, { emitEvent: false });
  }

  aplicarMascaraTelefono(event: any): void {
    let valor = event.target.value.replace(/\D/g, '');
    if (valor.length > 10) valor = valor.substring(0, 10);
    if (valor.length >= 3) valor = '(' + valor.substring(0, 3) + ') ' + valor.substring(3);
    if (valor.length >= 9) {
      const parts = valor.split(') ');
      if (parts[1] && parts[1].length > 3) {
        valor = parts[0] + ') ' + parts[1].substring(0, 3) + '-' + parts[1].substring(3);
      }
    }
    this.form.patchValue({ telefono: valor }, { emitEvent: false });
  }
  
  async guardar(): Promise<void> {
    if (!this.form.valid) {
      this.notificacionService.error('Por favor completa todos los campos requeridos');
      return;
    }

    this.guardando = true;

    try {
      // ✅ IMPORTANTE: Obtener el valor incluso si está disabled
      const formValue = this.form.getRawValue();  // getRawValue() incluye campos disabled
      
      const recluso = {
        ...formValue,
        fechaNacimiento: Timestamp.fromDate(new Date(formValue.fechaNacimiento)),
        fechaIngreso: Timestamp.fromDate(new Date(formValue.fechaIngreso)),
        sentencia: formValue.sentencia ? Number(formValue.sentencia) : null
      };

      const resultado = await this.reclusosService.agregarRecluso(recluso);

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.form.reset();
        this.reclusoAgregado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al guardar');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.showModal = false;
    this.showModalChange.emit(false);
    this.form.reset();  // ✅ Resetear para próxima apertura
  }
}