'use client';

import { useEffect, useState } from 'react';

const KEY = 'voice-agents:brand-id';

// hq-x rejects any path.brand_id that isn't a valid UUID with a 422
// validation_error. Mirror that here so we never round-trip an obviously bad
// value (and so we can flag invalid input in the UI before the backend yells).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidBrandId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

export function useBrandId(): [string, (id: string) => void] {
  const [brandId, setBrandIdState] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(KEY);
    if (!stored) return;
    // Drop legacy/garbage values (e.g. "Global" from a pre-validation typo)
    // so a stale localStorage entry doesn't pin the page in a 422 loop.
    if (!isValidBrandId(stored)) {
      window.localStorage.removeItem(KEY);
      return;
    }
    setBrandIdState(stored);
  }, []);

  const setBrandId = (id: string) => {
    const trimmed = id.trim();
    setBrandIdState(trimmed);
    if (typeof window !== 'undefined') {
      if (trimmed) window.localStorage.setItem(KEY, trimmed);
      else window.localStorage.removeItem(KEY);
    }
  };

  return [brandId, setBrandId];
}
