import { createContext, useContext } from 'react';
import { Router } from './useRouter';

export const LocalRouterContext = createContext<Router>({} as Router);
export const LocalRouterProvider = LocalRouterContext.Provider;

// Hook version
export function useLocalRouter() {
  return useContext(LocalRouterContext);
}
