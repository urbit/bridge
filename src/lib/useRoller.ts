import { useCallback, useEffect, useMemo, useState } from 'react';
import { Config, RollerRPCAPI, Options } from '@urbit/roller-api';
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
    const port = 80;
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

  // On load, get initial config
  useEffect(() => {
    if (config) {
      return;
    }

    fetchConfig();
  }, [config, fetchConfig]);

  return {
    config,
  };
}
