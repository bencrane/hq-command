'use client';

import { useEffect, useState } from 'react';

const KEY = 'voice-agents:brand-id';

export function useBrandId(): [string, (id: string) => void] {
  const [brandId, setBrandIdState] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(KEY);
    if (stored) setBrandIdState(stored);
  }, []);

  const setBrandId = (id: string) => {
    setBrandIdState(id);
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(KEY, id);
      else window.localStorage.removeItem(KEY);
    }
  };

  return [brandId, setBrandId];
}
