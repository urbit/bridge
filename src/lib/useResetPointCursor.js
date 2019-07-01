import { useEffect } from 'react';
import Maybe from 'folktale/maybe';

import { usePointCursor } from 'store/pointCursor';

export default function useResetPointCursor() {
  const { setPointCursor } = usePointCursor();

  useEffect(() => {
    setPointCursor(Maybe.Nothing());
  }, [setPointCursor]);
}
