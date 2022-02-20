import { version } from '../../package.json';

// are we running bridge in a development build
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isRopsten = process.env.REACT_APP_ROPSTEN === 'true';
export const isMainnet = process.env.REACT_APP_MAINNET === 'true';
export const versionLabel =
  process.env.REACT_APP_BRIDGE_VERSION || `${version}${isRopsten ? 'r' : ''}`;
export const providedRollerOptions = {
  host: process.env.REACT_APP_ROLLER_HOST,
  port: process.env.REACT_APP_ROLLER_PORT,
  type: process.env.REACT_APP_ROLLER_TRANSPORT_TYPE,
};
