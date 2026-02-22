// functions/src/index.ts

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from "firebase-functions/logger"; // ✅ IMPORTACIÓN FALTANTE

admin.initializeApp();

export const setUserRole = onCall(async (request) => {
  // 1. Verificar que el usuario que hace la petición esté autenticado
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para realizar esta acción.');
  }

  // 2. Seguridad: Verificar que el que hace la petición sea Super Administrador
  const callerRole = request.auth.token['role'];
  
  // ⚠️ NOTA PARA EL PRIMER USO: 
  // Si vas a asignarte el primer rol de Super Admin a ti mismo, 
  // comenta las siguientes 3 líneas temporalmente, despliega, ejecuta la función 
  // y luego vuelve a descomentarlas para proteger el sistema.
  if (callerRole !== 'SUPER_ADMINISTRADOR') {
    throw new HttpsError('permission-denied', 'Solo los Super Administradores pueden asignar roles.');
  }

  // 3. Obtener los datos enviados desde Angular
  const { uid, role } = request.data;

  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'Faltan parámetros (uid o role).');
  }

  try {
    // 4. Inyectar el Custom Claim en el Token de Firebase Auth
    await admin.auth().setCustomUserClaims(uid, { role: role });

    // 5. Sincronizar la base de datos (Firestore)
    await admin.firestore().collection('usuarios').doc(uid).update({ 
      rol: role,
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
    });

    return { 
      success: true, 
      message: `Rol '${role}' asignado correctamente al usuario.` 
    };

  } catch (error) {
    logger.error('Error al asignar Custom Claims:', error);
    throw new HttpsError('internal', 'Ocurrió un error interno al intentar asignar el rol.');
  }
});

export const createUser = onCall(async (request) => {
  // 1. Seguridad: Verificar que esté autenticado y sea Super Admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión para realizar esta acción.');
  }

  const callerRole = request.auth.token['role'];
  if (callerRole !== 'SUPER_ADMINISTRADOR') {
    throw new HttpsError('permission-denied', 'Solo los Super Administradores pueden crear nuevos usuarios.');
  }

  // 2. Extraer los datos enviados desde Angular
  const { email, nombre, apellido, rol } = request.data;

  if (!email || !nombre || !apellido || !rol) {
    throw new HttpsError('invalid-argument', 'Faltan campos obligatorios para crear el usuario.');
  }

  try {
    // 3. Crear el usuario en Firebase Authentication con una contraseña temporal
    const userRecord = await admin.auth().createUser({
      email: email,
      password: 'PrisionConnect2026!', 
      displayName: `${nombre} ${apellido}`.trim(),
    });

    const newUid = userRecord.uid;

    // 4. Inyectar el Custom Claim (Rol) inmediatamente
    await admin.auth().setCustomUserClaims(newUid, { role: rol });

    // 5. Crear el documento del usuario en Firestore
    await admin.firestore().collection('usuarios').doc(newUid).set({
      email: email,
      nombre: nombre,
      apellido: apellido,
      nombreCompleto: `${nombre} ${apellido}`.trim(),
      rol: rol,
      activo: true, 
      provider: 'correo',
      fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
      fechaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
      ultimoAcceso: null,
      avatar: ''
    });

    logger.info(`Usuario creado exitosamente: ${email} con UID: ${newUid}`);

    return { 
      success: true, 
      message: `Usuario ${nombre} creado exitosamente.` 
    };

  } catch (error: any) {
    logger.error('Error creando nuevo usuario:', error);
    
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Ya existe una cuenta con este correo electrónico.');
    }
    
    throw new HttpsError('internal', 'Ocurrió un error al crear la cuenta en el servidor.');
  }
});