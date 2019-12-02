import ob from 'urbit-ob';

import { usePointCursor } from 'store/pointCursor';

export default function useCurrentPointName() {
  const { pointCursor } = usePointCursor();

  return pointCursor.matchWith({
    Nothing: () => null,
    Just: p => ob.patp(p.value),
  });
}
