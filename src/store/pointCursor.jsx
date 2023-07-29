import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useState,
} from 'react';
import { Nothing } from 'folktale/maybe';
import { useRollerStore } from './rollerStore';
import { noop } from 'lodash';

const initialContext = {
  pointCursor: Nothing(),
  setPointCursor: noop,
};

export const PointCursorContext = createContext(initialContext);

// pointCursor is Maybe<number>
function _usePointCursor(initialPointCursor = Nothing()) {
  const [pointCursor, setPointCursor] = useState(initialPointCursor);
  const { setPoint } = useRollerStore();

  const handleSetPointCursor = useCallback(
    point => {
      setPoint(Number(point?.value));
      setPointCursor(point);
    },
    [setPoint, setPointCursor]
  );

  return {
    pointCursor,
    setPointCursor: handleSetPointCursor,
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
