'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type AppLoadContextValue = {
  shouldAnimate: boolean;
  ready: boolean;
};

const AppLoadContext = createContext<AppLoadContextValue>({
  shouldAnimate: false,
  ready: false,
});

const storageKey = 'clean-app-load-animated';

export function AppLoadProvider({ children }: { children: React.ReactNode }) {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const hasAnimated = sessionStorage.getItem(storageKey) === 'true';
      if (!hasAnimated) {
        sessionStorage.setItem(storageKey, 'true');
        setShouldAnimate(true);
      }
    } catch {
      setShouldAnimate(false);
    } finally {
      setReady(true);
    }
  }, []);

  return (
    <AppLoadContext.Provider value={{ shouldAnimate, ready }}>
      {children}
    </AppLoadContext.Provider>
  );
}

export function useAppLoadAnimation() {
  return useContext(AppLoadContext);
}
