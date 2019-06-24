import React, { createContext, forwardRef, useContext, useState } from 'react';

export const TxnConfirmationsContext = createContext(null);

function _useTxnConfirmations() {
  const [confirmations, setConfirmations] = useState({});

  const setTxnConfirmations = (txnHash, txnConfirmations) => {
    setConfirmations({
      ...confirmations,
      [txnHash]: txnConfirmations,
    });
  };

  return {
    txnConfirmations: confirmations,
    setTxnConfirmations,
  };
}

export function TxnConfirmationsProvider({ children }) {
  const value = _useTxnConfirmations();

  return (
    <TxnConfirmationsContext.Provider value={value}>
      {children}
    </TxnConfirmationsContext.Provider>
  );
}

// HOC version
export const withTxnConfirmations = Component =>
  forwardRef((props, ref) => (
    <TxnConfirmationsContext.Consumer>
      {txnConfirmations => (
        <Component ref={ref} {...txnConfirmations} {...props} />
      )}
    </TxnConfirmationsContext.Consumer>
  ));

// Hook version
export function useTxnConfirmations() {
  return useContext(TxnConfirmationsContext);
}
