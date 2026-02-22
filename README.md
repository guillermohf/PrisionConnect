<div align="center">

# 🏢 PrisionConnect

### Sistema de Gestión Penitenciaria Integral

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Sistema web moderno para la administración y control de visitas en centros penitenciarios de la República Dominicana**

[Características](#-características) • [Tecnologías](#-tecnologías) • [Instalación](#-instalación) • [Documentación](#-documentación)

---

</div>

## 📋 Tabla de Contenidos

- [Sobre el Proyecto](#-sobre-el-proyecto)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Roadmap](#-roadmap)
- [Contribución](#-contribución)
- [Licencia](#-licencia)
- [Contacto](#-contacto)

---

## 🎯 Sobre el Proyecto

**PrisionConnect** es un sistema integral de gestión penitenciaria desarrollado como proyecto de tesis universitaria para modernizar y digitalizar los procesos administrativos en centros penitenciarios de la República Dominicana.

### Problema que Resuelve

Los centros penitenciarios tradicionalmente manejan el registro y control de visitas mediante procesos manuales (papel y lápiz), lo que genera:

- ❌ Pérdida de registros históricos
- ❌ Falta de trazabilidad
- ❌ Procesos lentos e ineficientes
- ❌ Dificultad para generar reportes
- ❌ Ausencia de auditoría de seguridad

### Solución Propuesta

PrisionConnect digitaliza completamente estos procesos, ofreciendo:

- ✅ **Registro digital** de reclusos, visitantes y abogados
- ✅ **Control en tiempo real** de visitas con check-in/check-out
- ✅ **Trazabilidad completa** mediante auditoría automática
- ✅ **Reportes instantáneos** y estadísticas en tiempo real
- ✅ **Gestión de incidencias** con niveles de gravedad
- ✅ **Sistema de roles** con permisos granulares
- ✅ **Interfaz responsive** optimizada para tablets y móviles

---

## ✨ Características

### Gestión de Visitas
- 📅 **Registro de visitas** familiares y legales
- ⏰ **Check-in/Check-out** con registro de hora exacta
- 🚦 **Estados de visita** (Registrada → En Requisa → En Curso → Finalizada)
- 👥 **Multi-visitante** por visita con control individual
- ⚠️ **Sistema de incidencias** con 3 niveles de gravedad
- 📊 **Dashboard en tiempo real** con métricas clave

### Gestión de Reclusos
- 👤 **Perfil completo** con datos personales y penales
- 🏢 **Ubicación** por pabellón y celda
- 📋 **Historial de visitas** recibidas
- 👨‍👩‍👧 **Visitantes autorizados** asociados
- 📄 **Documentación** de expedientes y sentencias

### Gestión de Visitantes
- 🆔 **Validación de cédula** dominicana
- 📱 **Información de contacto** completa
- 🔗 **Asociación con reclusos** múltiple
- ✅ **Estado de autorización** para visitar
- 📝 **Historial de visitas** realizadas

### Gestión de Abogados
- ⚖️ **Registro con exequátur** profesional
- 👥 **Asignación de clientes** (reclusos)
- 📞 **Información de contacto** y especialidad
- 📊 **Estadísticas** de visitas legales

### Administración y Seguridad
- 👤 **Sistema de usuarios** con 4 roles (Admin, Supervisor, Recepcionista, Seguridad)
- 🔐 **Autenticación** con Firebase Auth (Email/Password y Google)
- 🔑 **Permisos granulares** por módulo
- 📝 **Audit logs** de todas las operaciones
- ⚙️ **Configuración** flexible de horarios, áreas y parámetros

### Reportes y Estadísticas
- 📊 **Dashboard principal** con métricas en tiempo real
- 📈 **Tendencias** semanales y mensuales
- 📉 **Análisis** de incidencias
- 📑 **Exportación** de reportes (próximamente)

---

## 🛠️ Tecnologías

### Frontend
```
Angular 18          - Framework principal
TypeScript 5.5      - Lenguaje de programación
Tailwind CSS 3.4    - Framework de estilos
RxJS 7             - Programación reactiva
Signals            - Gestión de estado
```

### Backend & Database
```
Firebase 10         - BaaS (Backend as a Service)
Firestore          - Base de datos NoSQL en tiempo real
Firebase Auth      - Autenticación y autorización
Cloud Functions    - Funciones serverless (próximamente)
Firebase Hosting   - Despliegue y hosting
```

### Herramientas de Desarrollo
```
Angular CLI        - Herramientas de desarrollo
ESLint            - Linter de código
Prettier          - Formateador de código
Git               - Control de versiones
```

---

## 🏗️ Arquitectura

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                     │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Angular   │  │ Tailwind   │  │   RxJS     │       │
│  │  Components│  │    CSS     │  │  Signals   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   FIREBASE (Cloud)                       │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Firestore   │  │Firebase Auth │  │   Hosting    │ │
│  │  (Database)  │  │   (Auth)     │  │  (Deploy)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Patrón de Arquitectura

El proyecto sigue una **arquitectura modular basada en features** con:

- 📁 **Core** - Servicios, guards, interceptores, modelos
- 📁 **Features** - Módulos funcionales (Visitas, Reclusos, etc.)
- 📁 **Shared** - Componentes, directivas, pipes reutilizables

### Base de Datos

**Firestore NoSQL** con las siguientes colecciones:

```
├── reclusos/              # Datos de reclusos
├── visitantes/            # Datos de visitantes
├── visitas/               # Registro de visitas
├── abogados/              # Abogados defensores
├── usuarios/              # Usuarios del sistema
├── incidencias/           # Incidencias reportadas
├── auditLogs/             # Registro de auditoría
├── configuracion/         # Parámetros del sistema
├── notificaciones/        # Notificaciones (próximamente)
└── estadisticas/          # Métricas agregadas
```

---

## 📦 Instalación

### Prerequisitos

```bash
Node.js >= 18.x
npm >= 9.x
Angular CLI >= 18.x
Cuenta de Firebase
```

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/prisionconnect.git
cd prisionconnect
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar Firebase**

Crea un archivo `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

4. **Iniciar el servidor de desarrollo**

```bash
ng serve
```

5. **Abrir en el navegador**

Navega a `http://localhost:4200`

---

## ⚙️ Configuración

### Variables de Entorno

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: { /* ... */ },
  appName: 'PrisionConnect',
  version: '1.0.0'
};
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar roles
    function hasRole(role) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid))
             .data.rol == role;
    }
    
    // Reclusos
    match /reclusos/{reclusoId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('supervisor');
    }
    
    // Visitas
    match /visitas/{visitaId} {
      allow read: if isAuthenticated();
      allow create: if hasRole('admin') || hasRole('recepcionista');
      allow update: if hasRole('admin') || hasRole('seguridad');
      allow delete: if hasRole('admin');
    }
    
    // ... más reglas
  }
}
```

### Configuración Inicial del Sistema

Al iniciar por primera vez, el sistema creará automáticamente:

1. **Documento de configuración** con valores predeterminados
2. **Usuario administrador** inicial
3. **Áreas de visita** predeterminadas
4. **Horarios** de lunes a domingo

---

## 📂 Módulos del Sistema

### 1. Dashboard 📊
- Vista general del sistema
- Estadísticas en tiempo real
- Gráficas de tendencias
- Accesos rápidos

### 2. Visitas 📅
- Crear nueva visita
- Check-in de visitantes
- Check-out de visitantes
- Cambiar estado de visita
- Reportar incidencias
- Cancelar visitas
- Historial completo

### 3. Reclusos 👤
- Registrar nuevo recluso
- Editar información
- Gestionar visitantes autorizados
- Ver historial de visitas
- Consultar expediente

### 4. Visitantes 👥
- Registrar visitante
- Editar información
- Autorizar/revocar acceso
- Asociar con reclusos
- Historial de visitas

### 5. Abogados ⚖️
- Registrar abogado
- Editar información
- Asignar clientes
- Gestionar especialidades
- Estadísticas de visitas legales

### 6. Usuarios 👤
- Crear usuario
- Asignar roles
- Gestionar permisos
- Activar/desactivar
- Historial de accesos

### 7. Configuración ⚙️
- Horarios de visita
- Parámetros del sistema
- Áreas de visita
- Resetear configuración

### 8. Historial 📜
- Registro completo de visitas
- Filtros avanzados
- Exportar reportes
- Estadísticas históricas

---

## 🗂️ Estructura del Proyecto

```
prisionconnect/
├── src/
│   ├── app/
│   │   ├── core/                    # Módulo core
│   │   │   ├── guards/             # Guards de autenticación
│   │   │   ├── interceptors/       # Interceptores HTTP
│   │   │   ├── models/             # Interfaces y tipos
│   │   │   └── services/           # Servicios principales
│   │   │
│   │   ├── features/               # Módulos de funcionalidad
│   │   │   ├── auth/              # Autenticación
│   │   │   ├── dashboard/         # Dashboard
│   │   │   ├── visitas/           # Gestión de visitas
│   │   │   ├── reclusos/          # Gestión de reclusos
│   │   │   ├── visitantes/        # Gestión de visitantes
│   │   │   ├── abogados/          # Gestión de abogados
│   │   │   ├── usuarios/          # Gestión de usuarios
│   │   │   ├── configuracion/     # Configuración
│   │   │   └── historial/         # Historial
│   │   │
│   │   ├── shared/                # Componentes compartidos
│   │   │   ├── components/       # Componentes reutilizables
│   │   │   ├── directives/       # Directivas
│   │   │   ├── pipes/            # Pipes personalizados
│   │   │   └── validators/       # Validadores
│   │   │
│   │   ├── layout/               # Componentes de layout
│   │   │   ├── header/
│   │   │   ├── sidebar/
│   │   │   └── footer/
│   │   │
│   │   └── app.component.ts      # Componente raíz
│   │
│   ├── assets/                   # Recursos estáticos
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── environments/             # Variables de entorno
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── styles.css               # Estilos globales
│
├── firestore.rules              # Reglas de seguridad Firestore
├── angular.json                 # Configuración de Angular
├── tailwind.config.js          # Configuración de Tailwind
├── tsconfig.json               # Configuración de TypeScript
└── package.json                # Dependencias del proyecto
```

---

## 📸 Capturas de Pantalla

### Dashboard Principal
*Vista general con estadísticas en tiempo real*

### Módulo de Visitas
*Gestión completa del ciclo de vida de una visita*

### Check-in de Visitantes
*Control de entrada con verificación de identidad*

### Gestión de Reclusos
*Registro y administración de información penal*

### Sistema de Configuración
*Parámetros flexibles del sistema*

> **Nota:** Capturas de pantalla disponibles en el directorio `/docs/screenshots/`

---

## 🗺️ Roadmap

### Versión 1.0 (Actual) ✅
- [x] Gestión completa de visitas
- [x] Sistema de check-in/check-out
- [x] Gestión de reclusos y visitantes
- [x] Sistema de incidencias
- [x] Audit logs
- [x] Configuración flexible
- [x] Responsive design

### Versión 1.1 (En Desarrollo) 🚧
- [ ] Exportación de reportes (PDF/Excel)
- [ ] Sistema de notificaciones push
- [ ] Módulo de estadísticas avanzadas
- [ ] Gráficas interactivas
- [ ] Búsqueda global

### Versión 2.0 (Planificado) 📋
- [ ] App móvil nativa (iOS/Android)
- [ ] Escaneo de códigos QR
- [ ] Reconocimiento facial
- [ ] Integración con CCTV
- [ ] API REST pública
- [ ] Módulo de reportes programados

---

## 🤝 Contribución

Las contribuciones son bienvenidas y apreciadas. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue las convenciones de código de Angular
- Escribe tests para nuevas funcionalidades
- Actualiza la documentación según sea necesario
- Usa commits semánticos (feat:, fix:, docs:, etc.)

---

## 📄 Licencia

Este proyecto es desarrollado como proyecto de tesis universitaria.

**Derechos Reservados © 2024-2025**

---

## 👨‍💻 Autor

**[Guillermo Herrera]**

- 🎓 Estudiante de Ingeniería en Sistemas
- 🏫 [Universidad Pedro Henriquez Ureña]
- 📧 Email: guillermohf045@gmail.com
- 💼 LinkedIn: [(https://www.linkedin.com/in/guillermo-herrera-1ab24520a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app)]
- 🐙 GitHub: [@guillermohf](https://github.com/guillermohf)

---

## 🙏 Agradecimientos

- **[UNPHU]** - Por el apoyo institucional
- **[Leonel Savery]** - Por la guía y mentoría
- **Comunidad de Angular** - Por los recursos y documentación
- **Firebase** - Por la plataforma BaaS
- **Tailwind CSS** - Por el framework de estilos


<div align="center">

### ⭐ Si este proyecto te fue útil, considera darle una estrella

**Desarrollado con ❤️ para modernizar el sistema penitenciario dominicano**

</div>
