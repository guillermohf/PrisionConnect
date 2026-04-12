# Guía de Defensa de Tesis - PrisionConnect

Este documento contiene las respuestas a las preguntas críticas de nivel de ingeniería de software que un jurado evaluador podría formular respecto a la arquitectura, seguridad y escalabilidad del sistema **PrisionConnect**.

---

## 1. Seguridad de Datos (Arquitectura Backendless)

**Pregunta del Jurado:**
*"Joven, veo que al usar Angular y Firebase la lógica de sus consultas viaja al propio navegador web del oficial. ¿Qué impide que un atacante técnico intercepte el tráfico o ingrese al servidor y altere los datos de un recluso, ya que no tiene un backend intermedio?"*

**Respuesta a Defender:**
> "La seguridad de PrisionConnect no depende de intentar ocultar el código de Angular, ya que este solo funciona como interfaz. La verdadera barrera de seguridad radica en dos componentes principales: 
> 
> Primero, el sistema de **Reglas de Seguridad de Firestore (Security Rules)** en los servidores de Google. El servidor base de datos intercepta toda petición y exige obligatoriamente un *Token de Autenticación válido* generado por Firebase Authentication para poder procesar permisos de lecturas o escrituras en colecciones críticas (reclusos, visitas, etc.).
> 
> En segundo lugar, a nivel frontend para mejorar la experiencia de usuario, utilizo **AuthGuards**, los cuales son guardianes de rutas de Angular que bloquean el renderizado visual al instante si el oficial no mantiene una sesión validada."

---

## 2. Escalabilidad y Rendimiento (Manejo del Tiempo Real)

**Pregunta del Jurado:**
*"Se menciona que el Dashboard y Recepción funcionan usando WebSockets para obtener información en tiempo real. Esto podría consumir extrema memoria RAM y facturación excesiva. Si la prisión procesa 2,000 visitas al día, ¿su sistema colapsará?"*

**Respuesta a Defender:**
> "El uso descontrolado del tiempo real sí colapsaría el sistema y causaría fugas de memoria (*Memory Leaks*). Por ello, el módulo fue diseñado implementando **estrategias de mitigación y ciclo de vida de componentes:**
>
> 1. Las suscripciones reactivas (`onSnapshot`) están indexadas y limitadas. No arrastran todo el historial penal eterno; extraen lógicamente solo aquellos registros pertenecientes al **día en curso** o cuyo estado es 'Activo', manteniendo al programa estable.
> 2. Se programó un algoritmo de desvinculación (flushing local) usando RxJS. El sistema persigue los *Listeners* en memoria y fuerza su destrucción instantánea cada vez que el oficial hace *Logout* o destruye la vista, asegurando que no queden procesos zombis estancados en el hilo principal."

---

## 3. Concurrencia de Usuarios (Falla Humana)

**Pregunta del Jurado:**
*"Imagine que dos oficiales apostados en distintas puertas del edificio intentan confirmar (Check-ins) al mismo visitante al mismo tiempo; ¿qué función de su sistema impide que los contadores del sistema arrojen resultados duplicados?"*

**Respuesta a Defender:**
> "El entorno PrisionConnect se construyó sobre un paradigma completamente reactivo alimentado por **Angular Signals**. Como operamos con sincronización bidireccional y sin tiempos muertos, las mutaciones de un cliente actualizan el *State* global de la aplicación para el resto en fragmentos de milisegundo. 
> 
> En el momento en que el primer oficial altera el estado de la visita (de `Registrada` a `En Curso`), el botón original del segundo oficial en la otra computadora se inhabilitaría inmediatamente (o la tarjeta cambiaría visualmente), impidiendo que emita la acción redundante. Además, Firebase maneja los conflictos transaccionales atómicamente asegurando la integridad del dato que llegó primero."

---

## 4. Tolerancia a Fallos y Restricciones de Infraestructura

**Pregunta del Jurado:**
*"Tractándose de un recinto amurallado con mucha interferencia y concreto armado, si un guardia de patio utiliza el móvil para consultar un pase y ocurre una intermitencia de red, ¿la pantalla de error fatal colgará sus operaciones?"*

**Respuesta a Defender:**
> "Frente a fallos de conectividad, el sistema se apoya en características nativas de las *PWA* (Aplicaciones Web Progresivas) y la **Persistencia de Caché** incluida en la SDK de Firebase.
>
> Si el dispositivo pierde red por unos segundos, Angular no se cuelga; las peticiones pasivas recurren a los últimos datos indexados en la memoria caché del navegador (Disco/RAM) permitiéndole visualizar información reciente temporalmente. De intentarse llevar a cabo una escritura (*Ej. Aprobar requisa*), esta se encola silenciosamente de modo *Offline* y se disparará de forma atómica a la nube en el momento que detecte el primer destello de restablecimiento de red, asegurando cero pérdida de maniobrabilidad administrativa."
