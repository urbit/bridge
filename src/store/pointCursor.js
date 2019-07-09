import React, { createContext, forwardRef, useContext, useState } from 'react';
import { Nothing } from 'folktale/maybe';

export const PointCursorContext = createContext(null);

// pointCursor is Maybe<number>
function _usePointCursor(initialPointCursor = Nothing()) {
  const [pointCursor, setPointCursor] = useState(initialPointCursor);

  return {
    pointCursor,
    setPointCursor,
  };
}

export function PointCursorProvider({ initialPointCursor, children }) {
  const pointCursor = _usePointCursor(initialPointCursor);

  return (
    <PointCursorContext.Provider value={pointCursor}>
      {children}
    </PointCursorContext.Provider>
  );
}

// Hook version
export function usePointCursor() {
  return useContext(PointCursorContext);
}

// HOC version
export const withPointCursor = Component =>
  forwardRef((props, ref) => (
    <PointCursorContext.Consumer>
      {pointCursor => <Component ref={ref} {...pointCursor} {...props} />}
    </PointCursorContext.Consumer>
  ));
