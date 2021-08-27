import { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function useRoller() {
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
      })
      .catch(err => {
        // TODO: more elegant error handling
        console.warn(
          '[fetchConfig:failed] is roller running on localhost?\n',
          err
        );
      });
  }, [api]);

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

  return {
    config,
    getPoints,
  };
}
