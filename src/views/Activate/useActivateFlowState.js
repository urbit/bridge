import { useCallback, useState } from 'react';
import { Nothing } from 'folktale/maybe';

export default function useActivateFlowState() {
  const [derivedPatp, setDerivedPatp] = useState(Nothing());
  const [derivedPoint, setDerivedPoint] = useState(Nothing());
  const [derivedPointDominion, setDerivedPointDominion] = useState(Nothing());
  const [derivedWallet, setDerivedWallet] = useState(Nothing());
  const [generated, setGenerated] = useState(false);
  const [incomingPoints, setIncomingPoints] = useState(Nothing());
  const [inviteWallet, setInviteWallet] = useState(Nothing());
  const [isIn, setIsIn] = useState(false);

  const reset = useCallback(() => {
    setDerivedPatp(Nothing());
    setDerivedPoint(Nothing());
    setDerivedPointDominion(Nothing());
    setDerivedWallet(Nothing());
    setGenerated(false);
    setIncomingPoints(Nothing());
    setInviteWallet(Nothing());
  }, [
    setDerivedPoint,
    setDerivedPointDominion,
    setDerivedWallet,
    setGenerated,
    setIncomingPoints,
    setInviteWallet,
  ]);

  return {
    derivedPatp,
    derivedPoint,
    derivedPointDominion,
    derivedWallet,
    generated,
    incomingPoints,
    inviteWallet,
    isIn,
    reset,
    setDerivedPatp,
    setDerivedPoint,
    setDerivedPointDominion,
    setDerivedWallet,
    setGenerated,
    setIncomingPoints,
    setInviteWallet,
    setIsIn,
  };
}
