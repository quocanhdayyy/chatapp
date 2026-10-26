import { useSyncExternalStore } from 'react';

function subscribe(listener: () => void) {
  if (typeof document === 'undefined') return () => {};
  document.addEventListener('visibilitychange', listener);
  return () => document.removeEventListener('visibilitychange', listener);
}

export function usePageVisible() {
  return useSyncExternalStore(subscribe,
    () => typeof document !== 'undefined' && document.visibilityState === 'visible',
    () => false);
}
