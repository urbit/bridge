import React, { useContext, useState } from 'react';

export const TxnConfirmationsContext = React.createContext(null);

export function TxnConfirmationsProvider({ children }) {
  const [confirmations, setConfirmations] = useState({});

  const setTxnConfirmations = (txnHash, txnConfirmations) => {
    setConfirmations({
      ...confirmations,
      [txnHash]: txnConfirmations,
    });
  };

  return (
    <TxnConfirmationsContext.Provider
      value={{
        txnConfirmations: confirmations,
        setTxnConfirmations,
      }}>
      {children}
    </TxnConfirmationsContext.Provider>
  );
}

// HOC version
export const withTxnConfirmations = Component => props => (
  <TxnConfirmationsContext.Consumer>
    {txnConfirmations => <Component {...txnConfirmations} {...props} />}
  </TxnConfirmationsContext.Consumer>
);

// Hook version
export function useTxnConfirmations() {
  return useContext(TxnConfirmationsContext);
}
