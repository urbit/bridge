import { useCallback, useEffect, useMemo, useState } from 'react';
import { Config, RollerRPCAPI, Options } from 'roller-rpc-client';
import { isDevelopment } from './flags';

export default function useRoller() {
  const [config, setConfig] = useState<Config | null>(null);

  const options: Options = useMemo(() => {
    const type = isDevelopment ? 'http' : 'https';
    // TODO: What is the prod host?
    const host = isDevelopment ? 'localhost' : 'bridge.urbit.org';
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
