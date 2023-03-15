import { createContext, useContext } from 'react';

export const ActivateFlowContext = createContext(null);
export const ActivateFlowProvider = ActivateFlowContext.Provider;

// Hook version
export function useActivateFlow() {
  return useContext(ActivateFlowContext);
}
