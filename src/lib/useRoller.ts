import { useCallback, useEffect, useMemo, useState } from 'react';
import * as wg from 'lib/walletgen';
import * as need from 'lib/need';
import * as azimuth from 'azimuth-js';
import * as ob from 'urbit-ob';

import {
  Config,
  Ship,
  Proxy,
  RollerRPCAPI,
  Options,
  EthAddress,
} from '@urbit/roller-api';
import { isDevelopment, isRopsten } from './flags';
import { ROLLER_HOSTS } from './constants';
import { useRollerStore } from 'store/roller';
import { getTimeToNextBatch } from './utils/roller';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import { useNetwork } from 'store/network';

export default function useRoller() {
  const { wallet, walletType, walletHdPath, authToken }: any = useWallet();
  const { pointCursor }: any = usePointCursor();
  const { web3, contracts }: any = useNetwork();

  const { nextBatchTime, setNextBatchTime, setNextRoll } = useRollerStore();
  const [config, setConfig] = useState<Config | null>(null);

  const options: Options = useMemo(() => {
    const type = isRopsten || !isDevelopment ? 'https' : 'http';
    const host = isRopsten
      ? ROLLER_HOSTS.ROPSTEN
      : isDevelopment
      ? ROLLER_HOSTS.LOCAL
      : ROLLER_HOSTS.MAINNET;
    const port = isDevelopment ? 8080 : 80;
    const path = '/v1/roller';

    return {
      transport: {
        type,
        host,
        port,
        path,
      },
    };
  }, []);

  const api = useMemo(() => {
    return new RollerRPCAPI(options);
  }, [options]);

  const fetchConfig = useCallback(async () => {
    api
      .getRollerConfig()
      .then(response => {
        setConfig(response);
        setNextBatchTime(response.nextBatch);
      })
      .catch(err => {
        // TODO: more elegant error handling
        console.warn(
          '[fetchConfig:failed] is roller running on localhost?\n',
          err
        );
      });
  }, [api]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateInviteCodes = useCallback(
    async (numInvites: number) => {
      const _point = need.point(pointCursor);
      const _contracts = contracts.getOrElse(null);
      const _web3 = web3.getOrElse(null);
      const _wallet = wallet.getOrElse(null);
      const _authToken = authToken.getOrElse(null);
      if (!_contracts || !_web3 || !_wallet || !_authToken) {
        // not using need because we want a custom error
        throw new Error('Internal Error: Missing Contracts/Web3/Wallet');
      }

      const planets: number[] = await azimuth.azimuth.getUnspawnedChildren(
        _contracts,
        _point
      );

      // const planets: any = await azimuth.delegatedSending.getPlanetsToSend(
      //   _contracts,
      //   _point,
      //   numInvites,
      // );

      const starInfo = await api.getPoint(_point);

      const tickets: { ticket: string; planet: string }[] = [];
      const requests: Promise<string>[] = [];

      const nonce = starInfo?.ownership?.owner?.nonce!;
      const address = starInfo?.ownership?.owner?.address!;

      for (let i = 0; i < numInvites && planets[i]; i++) {
        const planet = planets[i];

        const { ticket, owner } = await wg.generateTemporaryDeterministicWallet(
          planet,
          _authToken
        );

        const from = {
          ship: _point, //ship that is spawning the planet
          proxy: 'own', // this should be either "own" or "proxy"
        };

        const data = {
          address: owner.keys.address, // the new owner of the star (invite wallet)
          ship: planet, // ship to spawn
        };

        const txHash = await api.hashTransaction(
          nonce + i,
          from,
          'spawn',
          data
        );
        const { signature } = _web3.eth.accounts.sign(
          txHash,
          _wallet.privateKey.toString('hex')
        );

        requests.push(api.spawn(signature, from, address, data));
        tickets.push({ ticket, planet: ob.patp(planet) });
      }

      const hashes = await Promise.all(requests);

      return hashes.map((hash, i) => ({ hash, ...tickets[i] }));
    },
    [
      api,
      authToken,
      contracts,
      pointCursor,
      wallet,
      walletHdPath,
      walletType,
      web3
    ]
  );

  const getPoints = useCallback(
    async (proxy: Proxy, address: EthAddress) => {
      const points: Ship[] =
        proxy === 'own'
          ? await api.getOwnedPoints(address)
          : proxy === 'mange'
          ? await api.getManagerFor(address)
          : proxy === 'vote'
          ? await api.getVotingFor(address)
          : proxy === 'transfer'
          ? await api.getTransferringFor(address)
          : proxy === 'spawn'
          ? await api.getSpawningFor(address)
          : [];

      return points;
    },
    [api]
  );

  // On load, get initial config
  useEffect(() => {
    if (config) {
      return;
    }

    fetchConfig();
  }, [config, fetchConfig]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextRoll = getTimeToNextBatch(nextBatchTime, new Date().getTime());
      setNextRoll(nextRoll);

      if (nextBatchTime <= new Date().getTime()) {
        api.getRollerConfig().then(response => {
          setNextBatchTime(response.nextBatch);
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBatchTime]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    api,
    config,
    getPoints,
    generateInviteCodes,
  };
}
