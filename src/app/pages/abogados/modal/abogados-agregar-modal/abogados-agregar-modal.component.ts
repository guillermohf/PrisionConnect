// src/app/features/abogados/components/abogado-agregar-modal/abogado-agregar-modal.component.ts

import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AbogadosService } from '@core/services/abogados.service';
import { NotificacionService } from '@core/services/notificacion.service';
import { CrearAbogadoDTO } from '@core/models/abogado.interface';
import { TipoAbogado } from '@core/models/enums.interface';
import { ModalComponent } from '@shared/modal/modal.component';
import { ButtonComponent } from '@shared/button/buttton.component';
import { InputComponent } from '@shared/input/input.component';
import { cedulaDominicanaValidator, emailValidator, telefonoDominicanoValidator, mayorDeEdadValidator } from '@shared/validators/custom.validators';
import { TelefonoMaskDirective } from "@shared/directives/telefono.mask.directive";

@Component({
  selector: 'prisionConnect-abogado-agregar-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ButtonComponent,
    InputComponent,
    TelefonoMaskDirective
],
  templateUrl: './abogados-agregar-modal.component.html'
})
export class AbogadoAgregarModalComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() abogadoAgregado = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private abogadosService = inject(AbogadosService);
  private notificacionService = inject(NotificacionService);

  guardando = false;
  TipoAbogado = TipoAbogado;

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      cedula: ['', [Validators.required, cedulaDominicanaValidator()]],
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      exequatur: ['', [Validators.required, Validators.minLength(3)]],
      tipo: [TipoAbogado.PRIVADO, Validators.required],
      institucion: ['', [Validators.required, Validators.minLength(3)]],
      telefono: ['', [Validators.required, telefonoDominicanoValidator()]],
      email: ['', [Validators.required, emailValidator()]],
      fechaNacimiento: ['', [Validators.required, mayorDeEdadValidator()]]
    });
  }

  get fechaMaxNacimiento(): string {
    const f = new Date();
    f.setFullYear(f.getFullYear() - 18);
    return f.toISOString().split('T')[0];
  }


  async guardar(): Promise<void> {
    if (!this.form.valid) {
      this.notificacionService.error('Por favor completa todos los campos correctamente');
      this.form.markAllAsTouched();
      return;
    }

    this.guardando = true;

    try {
      const datos: CrearAbogadoDTO = this.form.value;
      const resultado = await this.abogadosService.crearAbogado(datos);

      if (resultado.success) {
        this.notificacionService.success(resultado.message);
        this.form.reset({ tipo: TipoAbogado.PRIVADO });
        this.abogadoAgregado.emit();
        this.cerrar();
      } else {
        this.notificacionService.error(resultado.message);
      }
    } catch (error) {
      this.notificacionService.error('Error inesperado al guardar abogado');
      console.error(error);
    } finally {
      this.guardando = false;
    }
  }

  cerrar(): void {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.form.reset({ tipo: TipoAbogado.PRIVADO });
  }

  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!(control && control.invalid && control.touched);
  }

}