'use client';

import { useState } from 'react';
import LiveResultsModal from '@/components/LiveResultsModal';

export default function LiveDashboardButton({ eventId, eventName }: { eventId: string, eventName: string }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShow(true)}
        className="bg-red-600/20 text-red-400 px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-red-600/30 transition-colors border border-red-500/30 flex items-center gap-2"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        Resultados En Vivo
      </button>

      {show && (
        <LiveResultsModal 
          eventId={eventId} 
          eventName={eventName}
          isOpen={true}
          onClose={() => setShow(false)} 
          isAdmin={true}
        />
      )}
    </>
  );
}
