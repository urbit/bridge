const rewireReactHotLoader = require('react-app-rewire-hot-loader');
const rewireAliases = require('react-app-rewire-aliases');

const alias = rewireAliases.aliasesOptions({
  'react-dom': '@hot-loader/react-dom',
});

module.exports = function override(config, env) {
  config = rewireReactHotLoader(config, env);
  config = alias(config, env);

  return config;
};
