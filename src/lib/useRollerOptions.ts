import { Options } from '@urbit/roller-api';
import { useMemo } from 'react';
import { ROLLER_HOSTS, ROLLER_PATH } from './constants';
import { convertToInt } from './convertToInt';
import { isMainnet, isRopsten, providedRollerOptions } from './flags';

type TransportType =
  | 'websocket'
  | 'http'
  | 'https'
  | 'postmessagewindow'
  | 'postmessageiframe';

/**
 * This hook produces a Roller API options config based on the runtime env.
 *
 * By default, it uses the hardcoded values from constants.ts, but optionally
 * a consumer of Bridge can provide a custom host, port, and transport type to
 * override these settings.
 *
 * @returns options (type Options from @urbit/roller-api)
 */
export const useRollerOptions = () => {
  const {
    host: providedHost,
    port: providedPort,
    type: providedType,
  } = providedRollerOptions;

  const options: Options = useMemo(() => {
    const type =
      (providedType as TransportType | undefined) ||
      (isMainnet || isRopsten ? 'https' : 'http');
    const host =
      providedHost ||
      (isMainnet
        ? ROLLER_HOSTS.MAINNET
        : isRopsten
        ? ROLLER_HOSTS.ROPSTEN
        : ROLLER_HOSTS.LOCAL);
    const port =
      (providedPort && convertToInt(providedPort, 10)) ||
      (isMainnet || isRopsten ? 443 : 8080);
    const path = ROLLER_PATH;

    return {
      transport: {
        type,
        host,
        port,
        path,
      },
    };
  }, [providedHost, providedPort, providedType]);

  return {
    options,
  };
};
