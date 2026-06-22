import React, { createContext, useContext, useState, useEffect } from "react";
import { rateLimiter } from "../utils/api";

interface RateLimitState {
  isPaused: boolean;
  secondsLeft: number;
}

const RateLimitContext = createContext<RateLimitState>({
  isPaused: false,
  secondsLeft: 0,
});

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<RateLimitState>({
    isPaused: false,
    secondsLeft: 0,
  });

  useEffect(() => {
    // Suscribirse a los eventos del rateLimiter exportado desde api.ts
    const unsubscribe = rateLimiter.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return (
    <RateLimitContext.Provider value={state}>
      {children}
    </RateLimitContext.Provider>
  );
}

export const useRateLimit = () => useContext(RateLimitContext);
