// are we running bridge in a development build
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isRopsten = process.env.REACT_APP_ROPSTEN === 'true';
