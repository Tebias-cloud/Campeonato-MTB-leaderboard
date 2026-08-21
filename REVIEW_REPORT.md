# Repository Review: Campeonato MTB Leaderboard

Este reporte técnico detalla una evaluación de la calidad del código, decisiones de arquitectura y áreas de mejora identificadas en el repositorio **Campeonato-MTB-leaderboard**.

---

## 📊 Tabla de Calificaciones

| Dimensión | Calificación | Enfoque de Evaluación |
| :--- | :---: | :--- |
| **Arquitectura** | ★★★★☆ | Flujo de Server Actions, modelo de Supabase/Next.js y políticas RLS. |
| **Organización** | ★★★★★ | Estructura de carpetas, separación de rutas públicas/privadas y aislamiento de lógica de negocio. |
| **Escalabilidad** | ★★★★☆ | Diseño de base de datos relacional. Oportunidades en atomicidad transaccional. |
| **Código & Algoritmos** | ★★★★☆ | Regex de coincidencia de atletas, normalización de datos y parsing de archivos PDF. |
| **Testing** | ★★★☆☆ | Ausencia de frameworks formalizados (Jest/Cypress). Scripts de simulación integrados. |
| **Documentación** | ★★★★★ | Manual operativo detallado y alineación de especificaciones técnicas con el código. |

---

## 🔍 Análisis Técnico Detallado

### 1. Arquitectura
El código implementa el framework **Next.js 15** junto con **Supabase** (PostgreSQL).
*   **Separación de Clientes Supabase:** La seguridad se organiza dividiendo la inicialización de Supabase en dos:
    1.  `supabase.ts` (Cliente público con llave `ANON`): Utiliza políticas a nivel de fila (**RLS - Row Level Security**) para consultas públicas.
    2.  `supabase-admin.ts` (Cliente administrativo con `SERVICE_ROLE`): Bypassa RLS exclusivamente en operaciones del servidor (`actions/`) que requieren privilegios de administración (como la reasignación de dorsales o aprobación masiva).
*   **Server Actions en Next.js:** El uso de Server Actions en la carpeta `actions/` permite centralizar la lógica mutativa del lado del servidor, eliminando la exposición de endpoints API adicionales y ejecutando validaciones antes de impactar la base de datos.

### 2. Organización del Proyecto
La estructura sigue las convenciones del App Router de Next.js:
*   **Rutas Segmentadas:** El uso de grupos de rutas como `(admin)` y `(public)` define los límites para los middlewares de autenticación y los layouts visuales.
*   **Componentes Modulares:** Se observa el aislamiento de los componentes reactivos en `components/admin/` (como [ResultManager.tsx](file:///c:/Users/Esteban/Desktop/proyectosT/Campeonato-MTB-leaderboard/components/admin/ResultManager.tsx)) y la lógica reutilizable en [lib/utils.ts](file:///c:/Users/Esteban/Desktop/proyectosT/Campeonato-MTB-leaderboard/lib/utils.ts) y [lib/categories.ts](file:///c:/Users/Esteban/Desktop/proyectosT/Campeonato-MTB-leaderboard/lib/categories.ts).

### 3. Escalabilidad y Base de Datos
*   **Diseño Relacional Desacoplado:** Para evitar problemas de caché en el esquema de Supabase, se observa el uso de un patrón desacoplado sin realizar sentencias JOIN complejas. Las Server Actions y páginas realizan consultas secuenciales (vía `Promise.all` o mapeos en memoria como `Map` o `Set`).
*   **Área de Mejora (Atomicidad Transaccional):** En flujos como `approveRequest` ([actions/admin.ts](file:///c:/Users/Esteban/Desktop/proyectosT/Campeonato-MTB-leaderboard/actions/admin.ts#L45-L200)), se ejecutan operaciones secuenciales sobre múltiples tablas (`clubs`, `riders`, `event_riders`, `registrations` y `registration_requests`). Si alguna de estas fallase, la base de datos podría quedar en un estado inconsistente. 
    *   *Solución recomendada:* Migrar este flujo a una función RPC en PostgreSQL ejecutada dentro de una transacción (`BEGIN ... COMMIT`) para asegurar total atomicidad.

### 4. Código y Algoritmos
*   **Motor de Importación de Resultados:** El componente `ResultManager.tsx` carga dinámicamente `pdf.js` en el cliente para extraer texto de PDFs de cronometraje y aplica expresiones normales (`RIDER_REGEX`) para asociar dorsales, posiciones, nombres y tiempos.
*   **Estrategia de Sincronización:** El algoritmo clasifica los datos escaneados frente a la base de datos, mostrándole al administrador la diferencia (`NUEVO`, `SIN CAMBIOS`, `ACTUALIZAR` detallando los cambios de tiempo/puesto, o `DESCARTADO`).
*   **Normalización de Entradas:** Se observan validaciones en tiempo de ejecución para limpiar teléfonos chilenos (formato `+56 9...`), normalizar nombres de categorías y depurar cuentas de Instagram extrayendo el handle desde URLs completas.

### 5. Testing y Simulación
*   **Deuda Técnica:** El proyecto carece de una suite de pruebas unitarias o de integración automatizadas (como Jest o Playwright).
*   **Mitigación Operativa (Simuladores):** El proyecto cuenta con un entorno de simulación en la carpeta [scripts/](file:///c:/Users/Esteban/Desktop/proyectosT/Campeonato-MTB-leaderboard/scripts). El archivo [full-race-simulation.ts](file:///c:/Users/Esteban/Desktop/proyectosT/Campeonato-MTB-leaderboard/scripts/full-race-simulation.ts) realiza una simulación completa: limpia datos de prueba, inscribe corredores, realiza asignación secuencial de dorsales y procesa la importación de tiempos recalculando el ranking.

### 6. Documentación
El repositorio contiene dos guías operativas:
*   **MANUAL_ADMIN.md:** Documenta el uso del panel, la lógica del cronometraje y la resolución de problemas frecuentes.
*   **MANUAL_RAPIDO.md:** Una guía rápida de comandos de instalación y arranque para desarrolladores.

---

## 💡 Aspectos de Ingeniería Destacados para Entrevistas

1.  **¿Cómo resolviste la asignación masiva de dorsales previniendo colisiones en tiempo real?**
    *   *Respuesta:* Implementando un algoritmo en `actions/dorsals.ts` que obtiene el set completo de números ocupados del evento, ordena alfabéticamente a los corredores y les asigna números secuenciales saltando activamente los dorsales presentes en el set de ocupados.
2.  **¿Cómo controlaste la carga de red en el procesamiento de PDFs de cronometraje?**
    *   *Respuesta:* El procesamiento del PDF se realiza 100% en el navegador del cliente mediante la inyección diferida del motor de `pdf.js`. El backend solo recibe el JSON procesado final listo para ser insertado/actualizado en la base de datos, optimizando el ancho de banda del servidor.
3.  **¿Qué estrategia seguiste para la limpieza y robustez de los datos de los atletas?**
    *   *Respuesta:* Diseñé funciones puras de normalización para formatear números telefónicos de distintas longitudes, unificar categorías eliminando textos explicativos adicionales y forzar mayúsculas uniformes en RUTs, nombres y ciudades para evitar duplicados invisibles por diferencias ortográficas.
