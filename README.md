# 🚵‍♂️ Campeonato MTB Tarapacá - Plataforma de Gestión y Leaderboard

Plataforma integral desarrollada para la gestión de inscripciones, administración de eventos y visualización en tiempo real del ranking del Campeonato MTB Tarapacá. 

## 🚀 Tecnologías Principales (Tech Stack)

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router & Server Actions)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
* **Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Estilos:** Tailwind CSS 
* **Correos:** Nodemailer (Gmail App Passwords)

---

## 📂 Estructura y Flujo de Datos

### 1. Inscripción y Validación
*   **Público:** Los corredores se inscriben en el formulario dinámico.
*   **Bandeja de Entrada:** Las solicitudes llegan a "Solicitudes Pendientes".
*   **Aprobación:** Al aprobar, se crea/actualiza el registro en la tabla `riders` (histórico) y se crea un ticket en `event_riders` (participación actual).

### 2. Gestión de Dorsales
*   **Dorsal por Evento:** El sistema permite asignar números de placa específicos para cada carrera.
*   **Asignación Masiva:** Herramienta que ordena por nombre y asigna correlativos saltando números ya ocupados automáticamente.
*   **Arquitectura Robusta:** Consultas desacopladas (no-joins) para eliminar errores de "schema cache" y asegurar integridad de datos.

### 3. Cronometraje y Resultados
*   **Importación RaceTime:** El sistema procesa texto copiado desde RaceTime o PDFs escaneados.
*   **Ranking:** Calcula puntos por posición (100, 90, 80...) y actualiza el Ranking Global instantáneamente.

### 4. Seguimiento de Solicitudes
*   **Trazabilidad:** Registro de fecha de solicitud y evento objetivo.
*   **Detección de Duplicados:** Alertas visuales si un mismo RUT tiene varias solicitudes pendientes.

---

## 🛠️ Instalación y Desarrollo

1.  **Clonar el repo e instalar dependencias:**
    ```bash
    npm install
    ```
2.  **Configurar Variables de Entorno:**
    Crea un archivo `.env.local` con las siguientes llaves:
    *   `NEXT_PUBLIC_SUPABASE_URL`
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY`
    *   `EMAIL_USER` (Cuenta Gmail para envíos)
    *   `EMAIL_PASS` (App Password de Gmail)

3.  **Ejecutar en desarrollo:**
    ```bash
    npm run dev
    ```

---

## 🧪 Herramientas de Mantenimiento

He incluido scripts robustos para asegurar la salud del sistema:
*   `npm run build`: Verifica que el código esté listo para producción sin errores.
*   `node scripts/verify-integrity.js`: Chequea que no existan datos huérfanos en la base de datos.
*   `tsx scripts/full-race-simulation.ts`: Simula una carrera completa para probar la lógica de puntos.

---

## 📖 Manual de Usuario
Para instrucciones detalladas sobre el uso del panel administrativo, consulta el [Manual del Administrador](MANUAL_ADMIN.md).