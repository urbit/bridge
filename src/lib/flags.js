import { version } from '../../package.json';

// are we running bridge in a development build
export const isDevelopment = import.meta.env.DEV === 'development';
export const isRopsten = import.meta.env.VITE_ROPSTEN === 'true';
export const isMainnet = import.meta.env.VITE_MAINNET === 'true';
export const versionLabel =
  import.meta.env.VITE_BRIDGE_VERSION || `${version}${isRopsten ? 'r' : ''}`;
export const providedRollerOptions = {
  host: import.meta.env.VITE_ROLLER_HOST,
  port: import.meta.env.VITE_ROLLER_PORT,
  type: import.meta.env.VITE_ROLLER_TRANSPORT_TYPE,
};
