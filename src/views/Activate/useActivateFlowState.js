import { useCallback, useState } from 'react';
import Maybe from 'folktale/maybe';

export default function useActivateFlowState() {
  const [derivedWallet, setDerivedWallet] = useState(Maybe.Nothing());
  const [inviteWallet, setInviteWallet] = useState(Maybe.Nothing());
  const [derivedPoint, setDerivedPoint] = useState(Maybe.Nothing());
  const [generated, setGenerated] = useState(false);

  const reset = useCallback(() => {
    setDerivedWallet(Maybe.Nothing());
    setInviteWallet(Maybe.Nothing());
    setDerivedPoint(Maybe.Nothing());
    setGenerated(false);
  }, [setDerivedWallet, setInviteWallet, setDerivedPoint, setGenerated]);

  return {
    derivedWallet,
    setDerivedWallet,
    inviteWallet,
    setInviteWallet,
    derivedPoint,
    setDerivedPoint,
    generated,
    setGenerated,
    reset,
  };
}
