import { useCallback, useState } from 'react';
import { Nothing } from 'folktale/maybe';

export default function useActivateFlowState() {
  const [derivedPatp, setDerivedPatp] = useState(Nothing());
  const [derivedPoint, setDerivedPoint] = useState(Nothing());
  const [generated, setGenerated] = useState(false);
  const [incomingPoints, setIncomingPoints] = useState(Nothing());
  const [derivedPointDominion, setDerivedPointDominion] = useState(Nothing());
  const [isIn, setIsIn] = useState(false);

  // A new wallet generated after confirming that the invite ticket is valid
  // and the point is available for activation.
  // At the end of the Activate flow, the point will be transferred
  // from the invite wallet to this wallet. When the user confirms
  // the Master Key (ticket) and downloads the passport / mnemonic,
  // it is for this wallet
  // type UrbitWallet
  const [inviteMasterTicketWallet, setInviteMasterTicketWallet] = useState(Nothing());
  // The wallet generated deterministically during the invite flow;
  // it is re-generated when the user starts the Activate flow. It is used
  // to derive and confirm a shareable ticket that a user can activate a point with.
  // type UrbitWallet
  const [inviteWallet, setInviteWallet] = useState(Nothing());
  // This wallet is generated from the invite wallet's seed phrase.
  // It is used during the transfer phase of the invite flow to send transactions.
  // useMultiKeyFileGenerator.
  // type bip32.BIP32Interface
  const [sendWallet, setSendWallet] = useState(Nothing());

  const reset = useCallback(() => {
    setDerivedPatp(Nothing());
    setDerivedPoint(Nothing());
    setDerivedPointDominion(Nothing());
    setInviteMasterTicketWallet(Nothing());
    setGenerated(false);
    setIncomingPoints(Nothing());
    setInviteWallet(Nothing());
    setSendWallet(Nothing());
  }, [
    setDerivedPatp,
    setDerivedPoint,
    setDerivedPointDominion,
    setInviteMasterTicketWallet,
    setGenerated,
    setIncomingPoints,
    setInviteWallet,
    setSendWallet,
  ]);

  return {
    derivedPatp,
    derivedPoint,
    derivedPointDominion,
    inviteMasterTicketWallet,
    generated,
    incomingPoints,
    inviteWallet,
    isIn,
    reset,
    sendWallet,
    setDerivedPatp,
    setDerivedPoint,
    setDerivedPointDominion,
    setInviteMasterTicketWallet,
    setGenerated,
    setIncomingPoints,
    setInviteWallet,
    setIsIn,
    setSendWallet,
  };
}
