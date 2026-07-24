import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD_EMJRUlJHBqVwDRa5x1L_xy91m2rxc3M",
  authDomain: "prisionconnect.firebaseapp.com",
  projectId: "prisionconnect",
  storageBucket: "prisionconnect.firebasestorage.app",
  messagingSenderId: "551685526457",
  appId: "1:551685526457:web:1641e7208c356196861c68"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'seguridad_de_puerta@prisionConnect.com';
const password = 'Password123!!';

try {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log('✅ Usuario creado en Auth. UID:', uid);

  await setDoc(doc(db, 'usuarios', uid), {
    uid,
    email,
    nombreCompleto: 'Seguridad de Puerta',
    nombre: 'Seguridad',
    apellido: 'Puerta',
    rol: 'Seguridad de Puerta',
    activo: true,
    fechaCreacion: Timestamp.now(),
    provider: 'email'
  });

  console.log('✅ Perfil creado en Firestore.');
  console.log('📧 Email   :', email);
  console.log('🔑 Password: Password123!!');
  console.log('👤 Rol     : Seguridad de Puerta');
  process.exit(0);
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
