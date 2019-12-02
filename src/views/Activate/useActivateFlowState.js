import { useCallback, useState } from 'react';
import { Nothing } from 'folktale/maybe';

export default function useActivateFlowState() {
  const [derivedWallet, setDerivedWallet] = useState(Nothing());
  const [inviteWallet, setInviteWallet] = useState(Nothing());
  const [derivedPoint, setDerivedPoint] = useState(Nothing());
  const [generated, setGenerated] = useState(false);

  const reset = useCallback(() => {
    setDerivedWallet(Nothing());
    setInviteWallet(Nothing());
    setDerivedPoint(Nothing());
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
