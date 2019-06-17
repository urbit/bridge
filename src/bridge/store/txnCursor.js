import React, { createContext, forwardRef, useContext, useState } from 'react';

export const TxnCursorContext = createContext(null);

function _useTxnCursor() {
  const [txnCursor, setTxnCursor] = useState({});

  return {
    txnCursor,
    setTxnCursor,
  };
}

export function TxnCursorProvider({ children }) {
  const txnCursor = _useTxnCursor();

  return (
    <TxnCursorContext.Provider value={txnCursor}>
      {children}
    </TxnCursorContext.Provider>
  );
}

// Hook version
export function useTxnCursor() {
  return useContext(TxnCursorContext);
}

// HOC version
export const withTxnCursor = Component =>
  forwardRef((props, ref) => (
    <TxnCursorContext.Consumer>
      {txnCursor => <Component ref={ref} {...txnCursor} {...props} />}
    </TxnCursorContext.Consumer>
  ));
