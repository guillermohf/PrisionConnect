// src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { routes } from './app.routes';
import { environment } from 'src/enviroments/enviroment.prod';

// ⭐ IMPORTANTE: Reemplaza estos valores con tu configuración de Firebase
// Los encuentras en: Firebase Console > Project Settings > Your apps

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    
    // ⭐ Configuración de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    
    // ⭐ Configuración de Firestore
    provideFirestore(() => getFirestore()),
    
    // ⭐ Configuración de Authentication
    provideAuth(() => getAuth())
  ]
};