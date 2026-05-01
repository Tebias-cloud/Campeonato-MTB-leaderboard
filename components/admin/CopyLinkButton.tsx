'use client';

import { useState } from 'react';

export default function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`inline-block text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border transition-all w-full text-center shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
        copied 
          ? 'bg-green-100 text-green-800 border-green-300' 
          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
      {copied ? '¡LINK COPIADO!' : 'COPIAR LINK'}
    </button>
  );
}