import { useState, useCallback } from 'react';

let id = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const tid = ++id;
    setToasts((t) => [...t, { id: tid, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== tid)), 3000);
  }, []);

  return { toasts, toast };
}
