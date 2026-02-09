import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Definimos las fuentes que cargamos en el layout
      fontFamily: {
        sans: ['var(--font-montserrat)', 'sans-serif'], // Texto legible
        heading: ['var(--font-teko)', 'sans-serif'],    // Títulos impactantes
      },
      colors: {
        // Paleta inspirada en el Desierto de Tarapacá y el afiche
        chaski: {
          sand: '#F4F1EA',      // Fondo arena claro
          beige: '#E5DDC5',     // Color de las tarjetas
          gold: '#D4AF37',      // Dorado para campeones
          terra: '#A34A28',     // Rojo/Terracota fuerte (Titulos)
          sunset: '#D67B35',    // Naranja atardecer (Degradados)
          teal: '#3A8E91',      // Turquesa de contraste (Accent)
          dark: '#2A221B',      // Café oscuro casi negro (Texto)
        },
      },
      backgroundImage: {
        // Textura sutil de arena para el fondo
        'sand-texture': "url('https://www.transparenttextures.com/patterns/sandpaper.png')",
      },
    },
  },
  plugins: [],
};
export default config;