import { version } from '../../package.json';

// are we running bridge in a development build
export const isDevelopment = import.meta.env.DEV === true;
// TODO update to Sepolia
export const isGoerli = import.meta.env.VITE_GOERLI === 'true';
export const isMainnet = import.meta.env.VITE_MAINNET === 'true';
export const versionLabel =
  import.meta.env.VITE_BRIDGE_VERSION || `${version}${isGoerli ? 'g' : ''}`;
export const providedRollerOptions = {
  host: import.meta.env.VITE_ROLLER_HOST,
  port: import.meta.env.VITE_ROLLER_PORT,
  type: import.meta.env.VITE_ROLLER_TRANSPORT_TYPE,
};
