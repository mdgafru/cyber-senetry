'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
      <div className="font-heading font-black uppercase text-4xl tracking-tighter mb-3">Error</div>
      <p className="font-mono text-sm text-muted-foreground mb-6 max-w-md">
        Something went wrong. Try again.
      </p>
      <button type="button" onClick={() => reset()} className="brutal-btn-primary text-[10px] px-4 py-2">
        Try again
      </button>
    </div>
  );
}
