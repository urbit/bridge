import { UnspawnedPoints } from '@urbit/roller-api';
import { DEFAULT_CSV_NAME, POINT_DOMINIONS } from 'lib/constants';
import { deriveNetworkSeedFromUrbitWallet } from 'lib/keys';
import * as need from 'lib/need';
import * as azimuth from 'azimuth-js';
import { Invite, Invites } from 'lib/types/Invite';
import useRoller from 'lib/useRoller';
import { useWalletConnect } from 'lib/useWalletConnect';
import { showNotification } from 'lib/utils/notifications';
import {
  generateInviteWallet,
  getPendingSpawns,
  submitL2Transaction,
  registerProxyAddress,
} from 'lib/utils/roller';
import { useCallback, useRef } from 'react';
import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/rollerStore';
import {
  getStoredInvites,
  setStoredInvite,
  setStoredInvites,
} from 'store/storage/roller';
import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import create from 'zustand';
import { generateCsvLine, generateCsvName } from 'lib/utils/invite';

const inviteTemplate = (
  planet: number,
  ticket = '',
  owner = '',
  hash = ''
): Invite => ({
  planet,
  ticket,
  owner,
  hash,
});

export type InviteGeneratingStatus =
  | 'initial'
  | 'generating'
  | 'finished'
  | 'errored';

interface InviteStore {
  invites: Invites;
  generatingStatus: InviteGeneratingStatus;
  generatingNum: number;
  loading: boolean;
  addInvite: (point: number, invite: Invite) => void;
  setInvites: (points: number, invites: Invite[]) => void;
}

export const useInviteStore = create<InviteStore>((set, get) => ({
  invites: {},
  generatingStatus: 'initial',
  generatingNum: 0,
  loading: false,
  addInvite: (point: number, invite: Invite) => {
    set(state => {
      const newInvites: Invites = {};
      const invites = state.invites[point];

      if (!invites.find(inv => inv.planet === invite.planet)) {
        newInvites[point] = [...invites, invite];
      }
      return { invites: Object.assign(state.invites, newInvites) };
    });
  },
  setInvites: (point: number, invites: Invite[]) =>
    set(state => {
      const newInvites: Invites = {};
      newInvites[point] = invites;
      return { invites: Object.assign(state.invites, newInvites) };
    }),
}));

export function useInvites() {
  const { wallet, authToken, walletType }: any = useWallet();
  const { connector } = useWalletConnect();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();
  const allPoints: any = usePointCache();
  const getDetails = allPoints?.getDetails;
  const { api, ls } = useRoller();
  const { point, pointList, setPendingTransactions } = useRollerStore();
  const { addInvite, setInvites } = useInviteStore();
  const updatingInvites = useRef<number[]>([]);

  const generateInviteInfo = async (planet: number, _authToken: string) => {
    const { ticket, inviteWallet } = await generateInviteWallet(
      planet,
      _authToken
    );

    return inviteTemplate(planet, ticket, inviteWallet.ownership.keys.address);
  };

  const getInvites = useCallback(async () => {
    if (updatingInvites.current.includes(point.value)) {
      return;
    }

    updatingInvites.current.push(point.value);
    try {
      useInviteStore.setState({ loading: true });
      const curPoint: number = Number(need.point(pointCursor));
      const _authToken = authToken.getOrElse(null);
      const _contracts = contracts.getOrElse(null);

      if (_authToken && _contracts) {
        const spawnedPoints = point.isL2Spawn
          ? await api.getSpawned(curPoint)
          : [];

        const newPending = await api.getPendingByShip(curPoint);
        setPendingTransactions(newPending);
        const pendingSpawns = getPendingSpawns(newPending);

        const availablePoints = await azimuth.azimuth.getUnspawnedChildren(
          _contracts,
          curPoint
        );

        const outgoingPoints = pointList
          .filter(
            ({ value, isPlanet }) => isPlanet && availablePoints.includes(value)
          )
          .map(({ value }) => value);

        const invitePlanets = spawnedPoints
          .concat(
            outgoingPoints.filter((p: number) => !spawnedPoints.includes(p))
          )
          .filter((p: number) => !pendingSpawns.has(p))
          .sort();

        setInvites(curPoint, []);

        const newInvites: Invite[] = [];
        // Iterate over all of the stored invites, generating wallet info as necessary
        const storedInvites = getStoredInvites(ls);

        for (let i = 0; i < invitePlanets.length; i++) {
          useInviteStore.setState({ generatingNum: i + 1 });
          const planet = invitePlanets[i];
          const storedInvite = storedInvites[planet];
          const invite =
            storedInvite || (await generateInviteInfo(planet, _authToken));

          // TODO: check if the invite point's owner still matches the deterministic wallet address
          const planetInfo = await api.getPoint(planet);
          setStoredInvite(ls, invite);

          if (
            invite.owner.toLowerCase() ===
              planetInfo.ownership?.owner?.address &&
            planetInfo.dominion === POINT_DOMINIONS.L2
          ) {
            addInvite(curPoint, invite);
            newInvites.push(invite);
          }

          if (storedInvite) {
            setStoredInvite(ls, invite);
          }
        }

        useInviteStore.setState({ loading: false, generatingNum: 0 });
        return newInvites;
      }
    } catch (error) {
      console.warn('ERROR GETTING INVITES', error);
      useInviteStore.setState({ loading: false, generatingNum: 0 });
    }

    const pointIndex = updatingInvites.current.indexOf(point.value);
    updatingInvites.current.splice(pointIndex, 1);
  }, [
    api,
    authToken,
    contracts,
    pointCursor,
    ls,
    point,
    pointList,
    addInvite,
    setInvites,
    setPendingTransactions,
  ]);

  const generateInviteCodes = useCallback(
    async (numInvites: number) => {
      const _point = need.point(pointCursor);
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      const _authToken = authToken.getOrElse(null);
      const _details = getDetails(_point);

      if (!_contracts || !_web3 || !_wallet || !_authToken || !_details) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      // TODO: remove when UI disables management proxy from spawning invites
      // if (Just.hasInstance(authMnemonic)) {
      //   throw new Error(
      //     "Auth key Error: A management mnemonic can't create invite codes"
      //   );
      // }
      let planets: UnspawnedPoints = await api.getUnspawned(_point);

      const pendingTxs = await api.getPendingByShip(_point);

      const pendingSpawns = getPendingSpawns(pendingTxs);

      planets = planets.filter((point: number) => !pendingSpawns.has(point));

      const invites: Invite[] = [];

      const proxy = point.getSpawnProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({
        ship: _point,
        proxy,
      });

      for (let i = 0; i < numInvites && planets[i]; i++) {
        useInviteStore.setState({ generatingNum: i + 1 });
        const planet = planets[i];
        const nonceInc = i + nonce;

        const { ticket, inviteWallet } = await generateInviteWallet(
          planet,
          _authToken
        );

        await submitL2Transaction({
          api,
          address: _wallet.address,
          wallet: _wallet,
          ship: _point,
          proxy,
          nonce: nonceInc,
          pointToSpawn: planet,
          type: 'spawn',
          walletType,
          web3: _web3,
          connector,
        });

        const networkSeed = await deriveNetworkSeedFromUrbitWallet(
          inviteWallet,
          1
        );
        await submitL2Transaction({
          api,
          wallet: _wallet,
          ship: planet,
          proxy: 'own',
          nonce: 0,
          networkSeed,
          type: 'configureKeys',
          walletType,
          web3: _web3,
          connector,
        });

        await registerProxyAddress(
          api,
          _wallet,
          planet,
          'own',
          'manage',
          1,
          inviteWallet.management.keys.address,
          walletType,
          _web3,
          connector
        );

        await submitL2Transaction({
          api,
          wallet: _wallet,
          ship: planet,
          proxy: 'own',
          type: 'transferPoint',
          nonce: 2,
          address: inviteWallet.ownership.keys.address,
          walletType,
          web3: _web3,
          connector,
        });

        invites.push({
          hash: '',
          ticket,
          planet,
          owner: inviteWallet.ownership.keys.address,
        });
      }

      setStoredInvites(ls, invites);
      console.log('getting invites from code generation');
      getInvites();
      showNotification(
        `Your invite${invites.length > 1 ? 's have' : ' has'} been generated!`
      );
    },
    [
      api,
      authToken,
      connector,
      contracts,
      pointCursor,
      point,
      wallet,
      walletType,
      web3,
      getDetails,
      ls,
      getInvites,
    ]
  );

  const generateCsv = useCallback(async () => {
    const invites = await getInvites();

    if (!invites) {
      throw new Error('There was an error creating the CSV');
    }

    const csv = invites.reduce(
      (csvData, { ticket, planet }, ind) =>
        (csvData += generateCsvLine(ind, ticket, planet)),
      'Number,Planet,Invite URL,Point,Ticket\n'
    );

    document.getElementById('csv')?.remove();
    const hiddenElement = document.createElement('a');
    hiddenElement.href = `data:text/csv;charset=utf-8,${encodeURIComponent(
      csv
    )}`;
    hiddenElement.target = '_blank';
    hiddenElement.id = 'csv';

    //provide the name for the CSV file to be downloaded
    hiddenElement.download = generateCsvName(
      DEFAULT_CSV_NAME,
      point.patp?.slice(1) || 'bridge'
    );

    return hiddenElement;
  }, [getInvites, point]);

  return {
    getInvites,
    generateCsv,
    generateInviteCodes,
  };
}
