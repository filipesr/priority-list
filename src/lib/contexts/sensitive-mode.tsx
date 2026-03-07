"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface SensitiveModeContextValue {
  isRevealed: boolean;
  reveal: () => void;
  hide: () => void;
}

const SensitiveModeContext = createContext<SensitiveModeContextValue>({
  isRevealed: false,
  reveal: () => {},
  hide: () => {},
});

export function SensitiveModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isRevealed, setIsRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setIsRevealed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const reveal = useCallback(() => {
    setIsRevealed(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsRevealed(false);
      timerRef.current = null;
    }, TIMEOUT_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <SensitiveModeContext value={{ isRevealed, reveal, hide }}>
      {children}
    </SensitiveModeContext>
  );
}

export function useSensitiveMode() {
  return useContext(SensitiveModeContext);
}
