// Allows us to use ES6 in migrations and tests.
require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: '0.0.0.0',
      port: 8545,
      network_id: '*', // Match any network id
      gas: 6000000,
      skipDryRun: true,
    },
  },
  compilers: {
    solc: {
      version: 'pragma',
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
