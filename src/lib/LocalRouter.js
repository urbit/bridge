import { createContext, useContext } from 'react';

export const LocalRouterContext = createContext(null);
export const LocalRouterProvider = LocalRouterContext.Provider;

// Hook version
export function useLocalRouter() {
  return useContext(LocalRouterContext);
}
