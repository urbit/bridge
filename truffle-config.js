require('babel-register');
require('babel-polyfill');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*', // Any network (default: none)
      gas: 6000000,
      skipDryRun: true,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {},

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.4.24',
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
