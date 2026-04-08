# 🚵‍♂️ Campeonato MTB Tarapacá - Plataforma de Gestión y Leaderboard

Plataforma integral desarrollada para la gestión de inscripciones, administración de eventos y visualización en tiempo real del ranking del Campeonato MTB Tarapacá. Construida con tecnologías modernas para asegurar escalabilidad, seguridad y una experiencia de usuario premium (tanto para corredores como para administradores).

## 🚀 Tecnologías Principales (Tech Stack)

* **Framework Frontend/Backend:** [Next.js 15](https://nextjs.org/) (App Router)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/) (Estricto tipado en todo el proyecto)
* **Base de Datos & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
* **Manejo de Formularios/Acciones:** React Server Actions (`'use server'`)
* **Correos Transaccionales:** [Nodemailer](https://nodemailer.com/) (Envío de correos automáticos al inscribirse)
* **Tipografía:** Google Fonts (`Teko` para encabezados racing, `Montserrat` para lectura clara)

---

## 📂 Estructura del Proyecto

El proyecto sigue la estructura recomendada del App Router de Next.js:

```bash
├── actions/             # Lógica de servidor (Server Actions). El "Backend" de la app.
│   ├── admin.ts         # Acciones de administrador (Aprobar, rechazar, exportar)
│   ├── events.ts        # Gestión de las carreras (Crear, editar, subir afiches)
│   └── register.ts      # Procesamiento de inscripciones públicas y envío de correos
├── app/                 # Rutas de la aplicación (Frontend)
│   ├── admin/           # Zona segura (Panel de control del administrador)
│   │   ├── events/      # Creador/Editor de fechas de campeonato
│   │   ├── resultados/  # Panel de carga de tiempos para el juez
│   │   ├── riders/      # Base de datos histórica de corredores
│   │   └── solicitudes/ # Bandeja de entrada de inscripciones (Para validar pagos)
│   ├── inscripcion/[id]/# Formulario público de inscripción por evento
│   ├── login/           # Acceso de administrador
│   └── page.tsx         # Landing Page: Ranking Oficial en Vivo
├── components/          # Componentes de React reutilizables (Botones, Modales, Tablas)
├── lib/                 # Utilidades y configuración
│   ├── definitions.ts   # Interfaces y Tipos de TypeScript (Modelos de BD)
│   └── supabase.ts      # Cliente de conexión a Supabase
└── public/              # Archivos estáticos (Imágenes, logos)