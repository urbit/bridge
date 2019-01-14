
const PROXY_TYPE = {
  MANAGEMENT_PROXY: Symbol('MANAGEMENT_PROXY'),
  SPAWN_PROXY: Symbol('SPAWN_PROXY'),
  TRANSFER_PROXY: Symbol('TRANSFER_PROXY'),
}

const renderProxyType = (proxyType) =>
    proxyType === PROXY_TYPE.MANAGEMENT_PROXY
  ? 'management'
  : proxyType === PROXY_TYPE.SPAWN_PROXY
  ? 'spawn'
  : proxyType === PROXY_TYPE.TRANSFER_PROXY
  ? 'transfer'
  : 'proxy'

export {
  PROXY_TYPE,
  renderProxyType
}

