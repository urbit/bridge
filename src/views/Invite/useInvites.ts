import { SpawnedPoints, UnspawnedPoints } from '@urbit/roller-api';
import { POINT_DOMINIONS } from 'lib/constants';
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
import { useCallback } from 'react';
import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';
import { useRollerStore } from 'store/rollerStore';
import {
  getStoredInvites,
  removeStoredInvite,
  setStoredInvite,
  setStoredInvites,
} from 'store/storage/roller';
import { useWallet } from 'store/wallet';
import { usePointCache } from 'store/pointCache';
import create from 'zustand';
import { generateCsvLine } from 'lib/utils/invite';
import Point from 'lib/types/Point';

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

interface InviteJob {
  generatingNum: number;
  status: InviteGeneratingStatus;
}

interface InviteStore {
  invites: Invites;
  inviteJobs: {
    [point: number]: InviteJob;
  };
  addInvite: (point: number, invite: Invite) => void;
  setInvites: (points: number, invites: Invite[]) => void;
  updateJob: (point: number, updates: Partial<InviteJob>) => void;
}

export const useInviteStore = create<InviteStore>((set, get) => ({
  invites: {},
  inviteJobs: {},
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
  updateJob: (point: number, updates: Partial<InviteJob>) => {
    const jobs = get().inviteJobs;
    const job = jobs[point] || { status: 'initial', generatingNum: 0 };
    const newJob = Object.assign({}, job, updates);
    jobs[point] = newJob;

    set({ inviteJobs: jobs });
  },
}));

export function useInvites() {
  const { wallet, authToken, walletType }: any = useWallet();
  const { connector } = useWalletConnect();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();
  const allPoints: any = usePointCache();
  const getDetails = allPoints?.getDetails;
  const { api, ls, performL2Reticket } = useRoller();
  const { point, pointList, setPendingTransactions } = useRollerStore();
  const {
    invites,
    inviteJobs,
    addInvite,
    setInvites,
    updateJob,
  } = useInviteStore();

  const generateInviteInfo = async (planet: number, _authToken: string) => {
    const { ticket, inviteWallet } = await generateInviteWallet(
      planet,
      _authToken
    );

    return inviteTemplate(planet, ticket, inviteWallet.ownership.keys.address);
  };

  const getInvites = useCallback(async () => {
    const inviteJob = inviteJobs[point.value];
    if (inviteJob?.status === 'generating') {
      return;
    }

    try {
      updateJob(point.value, { status: 'generating' });

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
          updateJob(point.value, { generatingNum: i + 1 });
          const planet = invitePlanets[i];
          const storedInvite = storedInvites[planet];
          const invite =
            storedInvite || (await generateInviteInfo(planet, _authToken));

          const planetInfo = await api.getPoint(planet);
          // unclaimed point: if still owned by the deterministic invite wallet
          if (
            invite.owner.toLowerCase() ===
              planetInfo.ownership?.owner?.address &&
            planetInfo.dominion === POINT_DOMINIONS.L2
          ) {
            setStoredInvite(ls, invite);
            addInvite(curPoint, invite);
            newInvites.push(invite);
          } else {
            // The point has been claimed, remove if it's in the cache
            if (storedInvite) {
              removeStoredInvite(ls, planet);
            }
          }
        }

        updateJob(point.value, { status: 'finished', generatingNum: 0 });
        return newInvites;
      }
    } catch (error) {
      console.warn('ERROR GETTING INVITES', error);
      updateJob(point.value, { status: 'errored', generatingNum: 0 });
    }
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
    updateJob,
  ]);

  const generateInviteCodes = useCallback(
    async (
      point: Point,
      planets: SpawnedPoints | UnspawnedPoints,
      spawn: boolean = true
    ) => {
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      const _authToken = authToken.getOrElse(null);

      if (!_contracts || !_web3 || !_wallet || !_authToken) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      const invites: Invite[] = [];
      const storedInvites = getStoredInvites(ls);

      const proxy = point.getSpawnProxy();

      if (proxy === undefined)
        throw new Error("Error: Address doesn't match proxy");

      const nonce = await api.getNonce({
        ship: point.value,
        proxy,
      });

      for (let i = 0; i < planets.length; i++) {
        updateJob(point.value, { generatingNum: i + 1 });
        const planet = planets[i];
        const nonceInc = i + nonce;

        // When reticketing a planet in a browser that previously generated
        // the invite, we need to remove it from the cache.
        const storedInvite = storedInvites[planet];
        if (storedInvite) {
          removeStoredInvite(ls, planet);
        }

        const { ticket, inviteWallet } = await generateInviteWallet(
          planet,
          _authToken
        );

        if (!spawn) {
          await performL2Reticket({
            point: planet,
            to: inviteWallet.ownership.keys.address,
            manager: inviteWallet.management.keys.address,
            fromWallet: _wallet,
            toWallet: inviteWallet,
          });
        } else {
          await submitL2Transaction({
            api,
            address: _wallet.address,
            wallet: _wallet,
            ship: point.value,
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
        }

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
      updateJob,
      performL2Reticket,
    ]
  );

  const generateCsv = useCallback(() => {
    const pointInvites = invites[point.value];

    if (!pointInvites) {
      throw new Error('There was an error creating the CSV');
    }

    return pointInvites.reduce(
      (csvData, { ticket, planet }, ind) =>
        (csvData += generateCsvLine(ind, ticket, planet)),
      'Number,Planet,Invite URL,Point,Ticket\n'
    );
  }, [invites, point]);

  return {
    getInvites,
    generateCsv,
    generateInviteCodes,
  };
}
