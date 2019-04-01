import * as bip32 from 'bip32'
import * as bip39 from 'bip39'
import keccak from 'keccak'
import * as lodash from 'lodash'
import Maybe from 'folktale/maybe'
import * as secp256k1 from 'secp256k1'

const DEFAULT_HD_PATH = "m/44'/60'/0'/0/0"

const ETH_ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const CURVE_ZERO_ADDR = "0x0000000000000000000000000000000000000000000000000000000000000000"

const WALLET_NAMES = {
  MNEMONIC: Symbol('MNEMONIC'),
  TICKET: Symbol('TICKET'),
  SHARDS: Symbol('SHARDS'),
  LEDGER: Symbol('LEDGER'),
  TREZOR: Symbol('TREZOR'),
  PRIVATE_KEY: Symbol('PRIVATE_KEY'),
  KEYSTORE: Symbol('KEYSTORE')
}

function EthereumWallet(privateKey) {
  this.privateKey = privateKey
  this.publicKey = secp256k1.publicKeyCreate(this.privateKey)
  const pub = this.publicKey.toString('hex')
  this.address = addressFromSecp256k1Public(pub)
}

const renderWalletType = (wallet) =>
    wallet === WALLET_NAMES.MNEMONIC
  ? 'Mnemonic'
  : wallet === WALLET_NAMES.TICKET
  ? 'Ticket'
  : wallet === WALLET_NAMES.SHARDS
  ? 'Ticket Shards'
  : wallet === WALLET_NAMES.LEDGER
  ? 'Ledger'
  : wallet === WALLET_NAMES.TREZOR
  ? 'Trezor'
  : wallet === WALLET_NAMES.PRIVATE_KEY
  ? 'Private Key'
  : wallet === WALLET_NAMES.KEYSTORE
  ? 'Keystore File'
  : 'Wallet'

const addressFromSecp256k1Public = pub => {
  const compressed = false
  const uncompressed = secp256k1.publicKeyConvert(
    Buffer.from(pub, 'hex'),
    compressed
  )
  const chopped = uncompressed.slice(1) // chop parity byte
  const hashed = keccak256(chopped)
  const addr = addHexPrefix(hashed.slice(-20).toString('hex'))
  return toChecksumAddress(addr)
}

const addHexPrefix = hex =>
  hex.slice(0, 2) === '0x'
  ? hex
  : '0x' + hex

const stripHexPrefix = hex =>
  hex.slice(0, 2) === '0x'
  ? hex.slice(2)
  : hex

const keccak256 = str =>
  keccak('keccak256').update(str).digest()

const isValidAddress = (address) =>
  /^0x[0-9a-fA-F]{40}$/.test(address)

const toChecksumAddress = (address) => {
  const addr = stripHexPrefix(address).toLowerCase()
  const hash = keccak256(addr).toString('hex')

  return lodash.reduce(addr, (acc, char, idx) =>
    parseInt(hash[idx], 16) >= 8
      ? acc + char.toUpperCase()
      : acc + char,
    '0x')
}

const eqAddr = (addr0, addr1) =>
  toChecksumAddress(addr0) === toChecksumAddress(addr1)

const walletFromMnemonic = (mnemonic, hdpath) => {
  const seed =
      bip39.validateMnemonic(mnemonic)
    ? Maybe.Just(bip39.mnemonicToSeed(mnemonic))
    : Maybe.Nothing()

  const toWallet = (sd, path) => {
    let wal
    try {
      const hd = bip32.fromSeed(sd)
      wal = Maybe.Just(hd.derivePath(path))
    } catch (_) {
      wal = Maybe.Nothing()
    }
    return wal
  }

  const wallet = seed.chain(sd => toWallet(sd, hdpath))
  return wallet
}

export {
  DEFAULT_HD_PATH,
  WALLET_NAMES,
  ETH_ZERO_ADDR,
  CURVE_ZERO_ADDR,
  renderWalletType,
  isValidAddress,
  toChecksumAddress,
  addressFromSecp256k1Public,
  eqAddr,
  walletFromMnemonic,
  addHexPrefix,
  EthereumWallet
}
