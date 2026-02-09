'use client';
import { useState } from 'react';
// En app/login/page.tsx
import { createClient } from '@/lib/supabase/client'; // <--- Apunta al archivo NUEVO
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Intentamos iniciar sesión con Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Error: Datos incorrectos');
      setLoading(false);
    } else {
      // 2. ÉXITO: Refrescamos la ruta y empujamos al admin
      // router.refresh() es CLAVE para que el middleware se entere del cambio
      router.refresh(); 
      router.push('/admin');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1816] px-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl text-white mb-2">ACCESO ADMIN</h1>
          <p className="text-gray-400 text-sm uppercase tracking-widest">Sistema de Cronometraje</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-[#C64928] outline-none transition-colors placeholder:text-gray-600"
              placeholder="admin@chaskiriders.cl"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 rounded-xl bg-black/40 border border-white/10 text-white focus:border-[#C64928] outline-none transition-colors placeholder:text-gray-600"
              placeholder="Contraseña"
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-4 bg-[#C64928] hover:bg-[#a02b10] text-white font-heading text-xl rounded-xl transition-all shadow-lg hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? 'ACCEDIENDO...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
}