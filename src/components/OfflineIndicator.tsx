import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-[#111111] px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white shadow-md whitespace-nowrap">
      <span>Mode hors-ligne · Sauvegarde locale active</span>
    </div>
  );
};
