'use client';

import { useTransition } from 'react';
import { deleteEvent } from '@/actions/events';

export default function DeleteEventButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    // Alerta nativa del navegador para evitar borrados accidentales
    if (window.confirm('⚠️ ¿Estás completamente seguro de eliminar esta carrera? Esta acción borrará el evento y todas las inscripciones asociadas para siempre.')) {
      startTransition(async () => {
        try {
          await deleteEvent(id);
        } catch (error) {
          alert('Hubo un error al intentar borrar el evento.');
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      title="Eliminar Evento"
      className="px-4 py-2 bg-slate-100 text-slate-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
    >
      {isPending ? (
        <span className="text-[10px] font-black uppercase tracking-wider animate-pulse">...</span>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          <span className="text-[10px] font-black uppercase tracking-wider">Borrar</span>
        </>
      )}
    </button>
  );
}