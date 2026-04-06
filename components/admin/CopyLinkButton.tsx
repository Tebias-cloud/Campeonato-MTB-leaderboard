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
      className={`inline-block text-[10px] font-black uppercase px-4 py-2 rounded-lg border transition-all w-full text-center shadow-sm active:scale-95 ${
        copied 
          ? 'bg-green-100 text-green-800 border-green-300' 
          : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      }`}
    >
      {copied ? '✓ ¡LINK COPIADO!' : '🔗 COPIAR LINK'}
    </button>
  );
}