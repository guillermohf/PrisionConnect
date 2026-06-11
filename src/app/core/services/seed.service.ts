// src/app/core/services/seed.service.ts

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  setDoc, 
  Timestamp 
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class SeedService {
  private firestore = inject(Firestore);

  // Datos Dummy de Reclusos
  private readonly RECLUSOS_DUMMY = [
    {
      numeroIdentificacion: "R-2024-001",
      cedula: "001-9876543-2",
      nombre: "Juan",
      apellido: "García",
      nombreCompleto: "Juan García",
      fechaNacimiento: "1985-05-15",
      edad: 39,
      sexo: "Masculino" as const,
      nacionalidad: "Dominicano",
      fotoUrl: "",
      pabellon: "A",
      celda: "12",
      fechaIngreso: "2023-01-10",
      situacionLegal: "Condenado" as const,
      activo: true,
      observaciones: "Sin observaciones especiales"
    },
    {
      numeroIdentificacion: "R-2024-002",
      cedula: "001-8765432-1",
      nombre: "Pedro",
      apellido: "Martínez",
      nombreCompleto: "Pedro Martínez",
      fechaNacimiento: "1990-08-20",
      edad: 34,
      sexo: "Masculino" as const,
      nacionalidad: "Dominicano",
      fotoUrl: "",
      pabellon: "B",
      celda: "05",
      fechaIngreso: "2023-06-15",
      situacionLegal: "Procesado" as const,
      activo: true,
      observaciones: "En espera de sentencia definitiva"
    },
    {
      numeroIdentificacion: "R-2024-003",
      cedula: "001-7654321-0",
      nombre: "Carlos",
      apellido: "Sánchez",
      nombreCompleto: "Carlos Sánchez",
      fechaNacimiento: "1988-03-12",
      edad: 36,
      sexo: "Masculino" as const,
      nacionalidad: "Dominicano",
      fotoUrl: "",
      pabellon: "A",
      celda: "08",
      fechaIngreso: "2023-03-20",
      situacionLegal: "Prisión Preventiva" as const,
      activo: true,
      observaciones: "Comparecencia programada para febrero 2025"
    },
    {
      numeroIdentificacion: "R-2024-004",
      cedula: "001-6543210-9",
      nombre: "Miguel",
      apellido: "Rodríguez",
      nombreCompleto: "Miguel Rodríguez",
      fechaNacimiento: "1982-11-30",
      edad: 42,
      sexo: "Masculino" as const,
      nacionalidad: "Dominicano",
      fotoUrl: "",
      pabellon: "C",
      celda: "15",
      fechaIngreso: "2022-09-05",
      situacionLegal: "Condenado" as const,
      activo: true,
      observaciones: "Buen comportamiento. Elegible para reducción de pena"
    },
    {
      numeroIdentificacion: "R-2024-005",
      cedula: "001-5432109-8",
      nombre: "José",
      apellido: "Fernández",
      nombreCompleto: "José Fernández",
      fechaNacimiento: "1995-07-18",
      edad: 29,
      sexo: "Masculino" as const,
      nacionalidad: "Dominicano",
      fotoUrl: "",
      pabellon: "B",
      celda: "22",
      fechaIngreso: "2024-02-14",
      situacionLegal: "Procesado" as const,
      activo: true,
      observaciones: "Primera ofensa. Colaborando con las autoridades"
    }
  ];

  // Datos Dummy de Visitantes
  private readonly VISITANTES_DUMMY = [
    {
      cedula: "001-1234567-8",
      nombre: "María",
      apellido: "García",
      nombreCompleto: "María García",
      telefono: "809-555-0101",
      direccion: "Av. Winston Churchill, Santo Domingo",
      email: "maria.garcia@example.com",
      activo: true,
      totalVisitas: 1,
      observaciones: "Cónyuge de Juan García"
    },
    {
      cedula: "001-2345678-9",
      nombre: "Lucía",
      apellido: "Martínez",
      nombreCompleto: "Lucía Martínez",
      telefono: "809-555-0102",
      direccion: "Calle El Conde, Santo Domingo",
      email: "lucia.martinez@example.com",
      activo: true,
      totalVisitas: 1,
      observaciones: "Madre de Pedro Martínez"
    },
    {
      cedula: "001-3456789-0",
      nombre: "Ramón",
      apellido: "Sánchez",
      nombreCompleto: "Ramón Sánchez",
      telefono: "809-555-0103",
      direccion: "Av. Máximo Gómez, Santo Domingo",
      email: "ramon.sanchez@example.com",
      activo: true,
      totalVisitas: 0,
      observaciones: "Padre de Carlos Sánchez"
    },
    {
      cedula: "001-4567890-1",
      nombre: "Ana",
      apellido: "Rodríguez",
      nombreCompleto: "Ana Rodríguez",
      telefono: "809-555-0104",
      direccion: "Carr. Mella, Santo Domingo Este",
      email: "ana.rodriguez@example.com",
      activo: true,
      totalVisitas: 0,
      observaciones: "Hermana de Miguel Rodríguez"
    },
    {
      cedula: "001-5678901-2",
      nombre: "Francisco",
      apellido: "Fernández",
      nombreCompleto: "Francisco Fernández",
      telefono: "809-555-0105",
      direccion: "Av. Estrella Sadhalá, Santiago",
      email: "francisco.fernandez@example.com",
      activo: true,
      totalVisitas: 0,
      observaciones: "Hermano de José Fernández"
    }
  ];

  // Datos Dummy de Abogados
  private readonly ABOGADOS_DUMMY = [
    {
      cedula: "002-1111111-1",
      nombre: "Roberto",
      apellido: "Gómez",
      nombreCompleto: "Roberto Gómez",
      exequatur: "12345-67",
      tipo: "Privado" as const,
      institucion: "Bufete Gómez & Asociados",
      telefono: "809-555-0201",
      email: "roberto.gomez@example.com",
      activo: true,
      observaciones: "Abogado penalista privado",
      estadisticas: {
        totalReclusos: 2,
        reclusosActivos: 2,
        totalVisitas: 0
      }
    },
    {
      cedula: "002-2222222-2",
      nombre: "Laura",
      apellido: "Peralta",
      nombreCompleto: "Laura Peralta",
      exequatur: "76543-21",
      tipo: "Público" as const,
      institucion: "Defensa Pública RD",
      telefono: "809-555-0202",
      email: "laura.peralta@example.com",
      activo: true,
      observaciones: "Defensora pública asignada",
      estadisticas: {
        totalReclusos: 1,
        reclusosActivos: 1,
        totalVisitas: 1
      }
    }
  ];

  /**
   * Eliminar todos los documentos de una colección
   */
  private async deleteCollection(name: string): Promise<void> {
    try {
      const colRef = collection(this.firestore, name);
      const snap = await getDocs(colRef);
      const promises = snap.docs.map(docSnap => 
        deleteDoc(doc(this.firestore, `${name}/${docSnap.id}`))
      );
      await Promise.all(promises);
      console.log(`✅ Colección '${name}' vaciada.`);
    } catch (error) {
      console.error(`❌ Error vaciando colección '${name}':`, error);
      throw error;
    }
  }

  /**
   * Vaciar base de datos (menos usuarios) y cargar datos dummy
   */
  async seedDatabase(): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Vaciar colecciones transaccionales
      console.log('🔄 Vaciando base de datos...');
      const coleccionesABorrar = [
        'reclusos',
        'visitantes',
        'visitas',
        'abogados',
        'relaciones_abogados',
        'relaciones_visitantes',
        'incidencias',
        'auditLogs'
      ];
      
      for (const col of coleccionesABorrar) {
        await this.deleteCollection(col);
      }

      // 2. Preparar e insertar Reclusos
      console.log('🔄 Cargando reclusos dummy...');
      const reclusosData = this.RECLUSOS_DUMMY.map((r, i) => {
        const docRef = doc(collection(this.firestore, 'reclusos'));
        return {
          docRef,
          data: {
            id: docRef.id,
            ...r,
            fechaNacimiento: Timestamp.fromDate(new Date(`${r.fechaNacimiento}T00:00:00`)),
            fechaIngreso: Timestamp.fromDate(new Date(`${r.fechaIngreso}T00:00:00`)),
            fechaCreacion: Timestamp.now(),
            fechaActualizacion: Timestamp.now(),
            creadoPor: 'sistema',
            estadisticas: {
              totalVisitantes: 1,
              totalAbogados: i < 3 ? 1 : 0,
              totalVisitas: i === 0 ? 1 : (i === 1 ? 1 : (i === 2 ? 1 : 0)),
              ultimaVisita: i <= 2 ? Timestamp.now() : null
            }
          }
        };
      });

      for (const item of reclusosData) {
        await setDoc(item.docRef, item.data);
      }

      // 3. Preparar e insertar Visitantes
      console.log('🔄 Cargando visitantes dummy...');
      const visitantesData = this.VISITANTES_DUMMY.map((v, i) => {
        const docRef = doc(collection(this.firestore, 'visitantes'));
        return {
          docRef,
          data: {
            id: docRef.id,
            ...v,
            fechaRegistro: Timestamp.now(),
            ultimaVisita: i <= 1 ? Timestamp.now() : null,
            fechaCreacion: Timestamp.now(),
            fechaActualizacion: Timestamp.now(),
            creadoPor: 'sistema'
          }
        };
      });

      for (const item of visitantesData) {
        await setDoc(item.docRef, item.data);
      }

      // 4. Preparar e insertar Abogados
      console.log('🔄 Cargando abogados dummy...');
      const abogadosData = this.ABOGADOS_DUMMY.map((a) => {
        const docRef = doc(collection(this.firestore, 'abogados'));
        return {
          docRef,
          data: {
            id: docRef.id,
            ...a,
            fechaRegistro: Timestamp.now(),
            fechaCreacion: Timestamp.now(),
            fechaActualizacion: Timestamp.now(),
            creadoPor: 'sistema'
          }
        };
      });

      for (const item of abogadosData) {
        await setDoc(item.docRef, item.data);
      }

      // 5. Relaciones de Visitantes (Autorizaciones)
      console.log('🔄 Cargando relaciones de visitantes...');
      const relacionesVisitantesData = [
        {
          reclusoId: reclusosData[0].data.id,
          reclusoNombre: reclusosData[0].data.nombreCompleto,
          visitanteId: visitantesData[0].data.id,
          visitanteNombre: visitantesData[0].data.nombreCompleto,
          parentesco: 'Cónyuge',
          autorizado: true,
          fechaAutorizacion: Timestamp.now(),
          fechaVencimiento: null,
          activo: true,
          observaciones: 'Acceso autorizado permanente',
          fechaCreacion: Timestamp.now()
        },
        {
          reclusoId: reclusosData[1].data.id,
          reclusoNombre: reclusosData[1].data.nombreCompleto,
          visitanteId: visitantesData[1].data.id,
          visitanteNombre: visitantesData[1].data.nombreCompleto,
          parentesco: 'Madre',
          autorizado: true,
          fechaAutorizacion: Timestamp.now(),
          fechaVencimiento: null,
          activo: true,
          observaciones: 'Acceso autorizado permanente',
          fechaCreacion: Timestamp.now()
        },
        {
          reclusoId: reclusosData[2].data.id,
          reclusoNombre: reclusosData[2].data.nombreCompleto,
          visitanteId: visitantesData[2].data.id,
          visitanteNombre: visitantesData[2].data.nombreCompleto,
          parentesco: 'Padre',
          autorizado: true,
          fechaAutorizacion: Timestamp.now(),
          fechaVencimiento: null,
          activo: true,
          observaciones: 'Acceso autorizado permanente',
          fechaCreacion: Timestamp.now()
        },
        {
          reclusoId: reclusosData[3].data.id,
          reclusoNombre: reclusosData[3].data.nombreCompleto,
          visitanteId: visitantesData[3].data.id,
          visitanteNombre: visitantesData[3].data.nombreCompleto,
          parentesco: 'Hermana',
          autorizado: true,
          fechaAutorizacion: Timestamp.now(),
          fechaVencimiento: null,
          activo: true,
          observaciones: 'Acceso autorizado permanente',
          fechaCreacion: Timestamp.now()
        },
        {
          reclusoId: reclusosData[4].data.id,
          reclusoNombre: reclusosData[4].data.nombreCompleto,
          visitanteId: visitantesData[4].data.id,
          visitanteNombre: visitantesData[4].data.nombreCompleto,
          parentesco: 'Hermano',
          autorizado: true,
          fechaAutorizacion: Timestamp.now(),
          fechaVencimiento: null,
          activo: true,
          observaciones: 'Acceso autorizado permanente',
          fechaCreacion: Timestamp.now()
        }
      ].map(rel => {
        const docRef = doc(collection(this.firestore, 'relaciones_visitantes'));
        return { docRef, data: { id: docRef.id, ...rel } };
      });

      for (const item of relacionesVisitantesData) {
        await setDoc(item.docRef, item.data);
      }

      // 6. Relaciones de Abogados
      console.log('🔄 Cargando relaciones de abogados...');
      const relacionesAbogadosData = [
        {
          abogadoId: abogadosData[0].data.id,
          abogadoNombre: abogadosData[0].data.nombreCompleto,
          abogadoExequatur: abogadosData[0].data.exequatur,
          abogadoTipo: abogadosData[0].data.tipo,
          reclusoId: reclusosData[0].data.id,
          reclusoNombre: reclusosData[0].data.nombreCompleto,
          reclusoPabellon: reclusosData[0].data.pabellon,
          fechaAsignacion: Timestamp.now(),
          fechaFinalizacion: null,
          activo: true,
          tipoCaso: 'Penal' as const,
          numeroExpediente: 'EXP-2023-998',
          estadoCaso: 'Activo' as const,
          observaciones: 'Caso asignado inicialmente',
          fechaCreacion: Timestamp.now()
        },
        {
          abogadoId: abogadosData[0].data.id,
          abogadoNombre: abogadosData[0].data.nombreCompleto,
          abogadoExequatur: abogadosData[0].data.exequatur,
          abogadoTipo: abogadosData[0].data.tipo,
          reclusoId: reclusosData[1].data.id,
          reclusoNombre: reclusosData[1].data.nombreCompleto,
          reclusoPabellon: reclusosData[1].data.pabellon,
          fechaAsignacion: Timestamp.now(),
          fechaFinalizacion: null,
          activo: true,
          tipoCaso: 'Penal' as const,
          numeroExpediente: 'EXP-2023-552',
          estadoCaso: 'Activo' as const,
          observaciones: 'Caso asignado inicialmente',
          fechaCreacion: Timestamp.now()
        },
        {
          abogadoId: abogadosData[1].data.id,
          abogadoNombre: abogadosData[1].data.nombreCompleto,
          abogadoExequatur: abogadosData[1].data.exequatur,
          abogadoTipo: abogadosData[1].data.tipo,
          reclusoId: reclusosData[2].data.id,
          reclusoNombre: reclusosData[2].data.nombreCompleto,
          reclusoPabellon: reclusosData[2].data.pabellon,
          fechaAsignacion: Timestamp.now(),
          fechaFinalizacion: null,
          activo: true,
          tipoCaso: 'Penal' as const,
          numeroExpediente: 'EXP-2024-012',
          estadoCaso: 'Activo' as const,
          observaciones: 'Asignación de oficio',
          fechaCreacion: Timestamp.now()
        }
      ].map(rel => {
        const docRef = doc(collection(this.firestore, 'relaciones_abogados'));
        return { docRef, data: { id: docRef.id, ...rel } };
      });

      for (const item of relacionesAbogadosData) {
        await setDoc(item.docRef, item.data);
      }

      // 7. Visitas
      console.log('🔄 Cargando visitas dummy...');
      const visitasData = [
        {
          tipo: 'Familiar' as const,
          reclusoId: reclusosData[0].data.id,
          reclusoNombre: reclusosData[0].data.nombreCompleto,
          reclusoPabellon: reclusosData[0].data.pabellon,
          reclusoCelda: reclusosData[0].data.celda,
          visitantes: [
            {
              visitanteId: visitantesData[0].data.id,
              nombre: visitantesData[0].data.nombreCompleto,
              cedula: visitantesData[0].data.cedula,
              parentesco: 'Cónyuge' as const,
              checkIn: Timestamp.fromDate(new Date(Date.now() - 4 * 3600000)),
              checkOut: Timestamp.fromDate(new Date(Date.now() - 2 * 3600000)),
              presente: true
            }
          ],
          totalVisitantes: 1,
          visitantesPresentes: 1,
          abogado: null,
          fechaVisita: Timestamp.now(),
          horaInicioProgramada: '10:00',
          horaFinProgramada: '12:00',
          checkInPrincipal: Timestamp.fromDate(new Date(Date.now() - 4 * 3600000)),
          checkOutFinal: Timestamp.fromDate(new Date(Date.now() - 2 * 3600000)),
          duracionTotal: 120,
          duracionVisitaReal: 120,
          estado: 'Finalizada' as const,
          areaVisita: 'Sala de Visitas General',
          mesaNumero: '04',
          usuarioRecepcionId: 'sistema',
          usuarioRecepcionNombre: 'Sistema',
          observaciones: 'Visita familiar sin inconvenientes',
          incidencias: [],
          tiempos: {
            registro: Timestamp.fromDate(new Date(Date.now() - 5 * 3600000)),
            inicioRequisaEntrada: Timestamp.fromDate(new Date(Date.now() - 4.5 * 3600000)),
            finRequisaEntrada: Timestamp.fromDate(new Date(Date.now() - 4 * 3600000)),
            ingresoArea: Timestamp.fromDate(new Date(Date.now() - 4 * 3600000)),
            salidaArea: Timestamp.fromDate(new Date(Date.now() - 2 * 3600000)),
            inicioRequisaSalida: Timestamp.fromDate(new Date(Date.now() - 2 * 3600000)),
            finRequisaSalida: Timestamp.fromDate(new Date(Date.now() - 1.8 * 3600000)),
            finalizacion: Timestamp.fromDate(new Date(Date.now() - 1.8 * 3600000))
          },
          fechaCreacion: Timestamp.now(),
          creadoPor: 'sistema'
        },
        {
          tipo: 'Familiar' as const,
          reclusoId: reclusosData[1].data.id,
          reclusoNombre: reclusosData[1].data.nombreCompleto,
          reclusoPabellon: reclusosData[1].data.pabellon,
          reclusoCelda: reclusosData[1].data.celda,
          visitantes: [
            {
              visitanteId: visitantesData[1].data.id,
              nombre: visitantesData[1].data.nombreCompleto,
              cedula: visitantesData[1].data.cedula,
              parentesco: 'Madre' as const,
              checkIn: Timestamp.fromDate(new Date(Date.now() - 1 * 3600000)),
              checkOut: null,
              presente: true
            }
          ],
          totalVisitantes: 1,
          visitantesPresentes: 1,
          abogado: null,
          fechaVisita: Timestamp.now(),
          horaInicioProgramada: '14:00',
          horaFinProgramada: '16:00',
          checkInPrincipal: Timestamp.fromDate(new Date(Date.now() - 1 * 3600000)),
          checkOutFinal: null,
          estado: 'En Curso' as const,
          areaVisita: 'Sala de Visitas General',
          mesaNumero: '08',
          usuarioRecepcionId: 'sistema',
          usuarioRecepcionNombre: 'Sistema',
          observaciones: 'Visita familiar regular',
          incidencias: [],
          tiempos: {
            registro: Timestamp.fromDate(new Date(Date.now() - 2 * 3600000)),
            inicioRequisaEntrada: Timestamp.fromDate(new Date(Date.now() - 1.5 * 3600000)),
            finRequisaEntrada: Timestamp.fromDate(new Date(Date.now() - 1 * 3600000)),
            ingresoArea: Timestamp.fromDate(new Date(Date.now() - 1 * 3600000))
          },
          fechaCreacion: Timestamp.now(),
          creadoPor: 'sistema'
        },
        {
          tipo: 'Legal' as const,
          reclusoId: reclusosData[2].data.id,
          reclusoNombre: reclusosData[2].data.nombreCompleto,
          reclusoPabellon: reclusosData[2].data.pabellon,
          reclusoCelda: reclusosData[2].data.celda,
          visitantes: [],
          totalVisitantes: 0,
          visitantesPresentes: 0,
          abogado: {
            abogadoId: abogadosData[1].data.id,
            nombre: abogadosData[1].data.nombreCompleto,
            exequatur: abogadosData[1].data.exequatur,
            institucion: abogadosData[1].data.institucion,
            checkIn: null,
            checkOut: null
          },
          fechaVisita: Timestamp.now(),
          horaInicioProgramada: '16:00',
          horaFinProgramada: '17:00',
          checkInPrincipal: null,
          checkOutFinal: null,
          estado: 'Registrada' as const,
          areaVisita: 'Área Legal',
          mesaNumero: 'L01',
          usuarioRecepcionId: 'sistema',
          usuarioRecepcionNombre: 'Sistema',
          observaciones: 'Reunión preparatoria para audiencia legal',
          incidencias: [],
          tiempos: {
            registro: Timestamp.now()
          },
          fechaCreacion: Timestamp.now(),
          creadoPor: 'sistema'
        }
      ].map(vis => {
        const docRef = doc(collection(this.firestore, 'visitas'));
        return { docRef, data: { id: docRef.id, ...vis } };
      });

      for (const item of visitasData) {
        await setDoc(item.docRef, item.data);
      }

      console.log('✅ Base de datos poblada con éxito.');
      return { success: true, message: 'Base de datos restablecida y poblada con éxito' };
    } catch (error: any) {
      console.error('❌ Error al poblar la base de datos:', error);
      return { success: false, message: 'Error al restablecer base de datos: ' + error.message };
    }
  }
}
