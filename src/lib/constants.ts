import { isDevelopment } from './flags';

const CHECK_BLOCK_EVERY_MS = isDevelopment ? 1000 : 10000;
const DEFAULT_GAS_PRICE_GWEI = 40;
const MAX_GAS_PRICE_GWEI = 400;

const MIN_GALAXY = 0;
const MAX_GALAXY = 255;
const MIN_STAR = 256;
const MAX_STAR = 65535;
const MIN_PLANET = 65536;
const MAX_PLANET = 4294967297;

const ZOD = MIN_GALAXY;

const PLANET_ENTROPY_BITS = 64;
const STAR_ENTROPY_BITS = 128;
const GALAXY_ENTROPY_BITS = 384;

const SEED_ENTROPY_BITS = 128;

//TODO move into azimuth-js
const GAS_LIMITS = {
  SPAWN: 250000,
  TRANSFER: 560000, //NOTE biggest, also update gas tank's max
  CONFIGURE_KEYS: 100000,
  SET_PROXY: 150000,
  //
  ESCAPE: 115000, //NOTE low sample size
  ADOPT: 100000, //NOTE low sample size
  CANCEL_ESCAPE: 200000, //NOTE no samples
  REJECT: 200000, //NOTE no samples
  DETACH: 200000, //NOTE no samples
  //
  GIFT_PLANET: 450000, //NOTE low sample size, //NOTE also update in gas tank
  //
  TRANSFER_LOCKUP: 700000, //NOTE low sample size
  //
  SEND_ETH: 21000,
  //
  DEFAULT: 550000,
};

// TODO: this is walletgen-ui specific, move into a wallet router later
const GEN_STATES = {
  ENY_NOSTART: Symbol('ENY_NOSTART'),
  ENY_PENDING: Symbol('ENY_PENDING'),
  ENY_SUCCESS: Symbol('ENY_SUCCESS'),
  ENY_FAILURE: Symbol('ENY_FAILURE'),
  DERIVATION_NOSTART: Symbol('DERIVATION_NOSTART'),
  DERIVATION_PENDING: Symbol('DERIVATION_PENDING'),
  DERIVATION_SUCCESS: Symbol('DERIVATION_SUCCESS'),
  DERIVATION_FAILURE: Symbol('DERIVATION_FAILURE'),
  PAPER_NOSTART: Symbol('PAPER_NOSTART'),
  PAPER_PENDING: Symbol('PAPER_PENDING'),
  PAPER_SUCCESS: Symbol('PAPER_SUCCESS'),
  PAPER_FAILURE: Symbol('PAPER_FAILURE'),
};

const BUTTON_STATES = {
  NOSTART: Symbol('NOSTART'),
  SUCCESS: Symbol('SUCCESS'),
  ERROR: Symbol('ERROR'),
  PENDING: Symbol('PENDING'),
};

const PROFILE_STATES = {
  NOSTART: Symbol('NOSTART'),
  UPLOAD_SUCCESS: Symbol('UPLOAD_SUCCESS'),
  UPLOAD_ERROR: Symbol('UPLOAD_ERROR'),
  INPUT_SUCCESS: Symbol('INPUT_SUCCESS'),
  INPUT_ERROR: Symbol('INPUT_ERROR'),
};

const PROGRESS_ANIMATION_DELAY_MS = 500; // .animated-width

const DEFAULT_HD_PATH = "m/44'/60'/0'/0/0";
const ETH_ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const ETH_ZERO_ADDR_SHORT = '0x0';

const LINEAR_STAR_RELEASE = '0x86cd9cd0992f04231751e3761de45cecea5d1801';
const CONDITIONAL_STAR_RELEASE = '0x8c241098c3d3498fe1261421633fd57986d74aea';

const WALLET_TYPES = {
  MNEMONIC: Symbol('MNEMONIC'),
  TICKET: Symbol('TICKET'),
  SHARDS: Symbol('SHARDS'),
  LEDGER: Symbol('LEDGER'),
  TREZOR: Symbol('TREZOR'),
  PRIVATE_KEY: Symbol('PRIVATE_KEY'),
  KEYSTORE: Symbol('KEYSTORE'),
  METAMASK: Symbol('METAMASK'),
  WALLET_CONNECT: Symbol('WALLET_CONNECT'),
};

const NONCUSTODIAL_WALLETS = new Set([
  WALLET_TYPES.METAMASK,
  WALLET_TYPES.TREZOR,
  WALLET_TYPES.LEDGER,
  WALLET_TYPES.WALLET_CONNECT,
]);

const ROLLER_HOSTS = {
  LOCAL: 'localhost',
  ROPSTEN: 'roller-tmp.urbit.org',
  MAINNET: 'roller.urbit.org',
};

const POINT_DOMINIONS = {
  L1: 'l1',
  L2: 'l2',
  SPAWN: 'spawn',
};

const POINT_PROXIES = {
  OWN: 'own',
  MANAGE: 'manage',
  TRANSFER: 'transfer',
  VOTE: 'vote',
  SPAWN: 'spawn',
};

// In ms
const DEFAULT_FADE_TIMEOUT = 300;
const MASTER_KEY_DURATION = 850;

const INVITES_PER_PAGE = 7;
const DEFAULT_NUM_INVITES = 5;
const DEFAULT_CSV_NAME = 'urbit_invites.csv';

const TRANSACTION_STATUS_ICONS: {
  [key: string]:
    | 'Checkmark'
    | 'ArrowNorth'
    | 'Clock'
    | 'ExclaimationMark'
    | 'NullIcon';
} = {
  confirmed: 'Checkmark',
  pending: 'Clock',
  sending: 'ArrowNorth',
  failed: 'ExclaimationMark',
  unknown: 'NullIcon',
};

const TRANSACTION_TYPE_ICONS: {
  [key: string]:
    | 'ArrowRefresh'
    | 'BootNode'
    | 'Delete'
    | 'EjectedSponsor'
    | 'EscapeApproved'
    | 'EscapeRejected'
    | 'EscapeRequested'
    | 'ShipSpawned'
    | 'Swap';
} = {
  adopt: 'EscapeApproved',
  'cancel-escape': 'EscapeRejected',
  'cancel-transfer': 'Delete',
  'configure-keys': 'BootNode',
  detach: 'EjectedSponsor',
  escape: 'EscapeRequested',
  migrate: 'Swap',
  reject: 'EscapeRejected',
  'set-management-proxy': 'ArrowRefresh',
  'set-spawn-proxy': 'ArrowRefresh',
  'set-transfer-proxy': 'ArrowRefresh',
  'set-voting-proxy': 'ArrowRefresh',
  spawn: 'ShipSpawned',
  'transfer-point': 'Swap',
};

const TRANSACTION_TYPE_TITLES: {
  [key: string]:
    | 'Ship Sponsored'
    | 'Escape Canceled'
    | 'Transfer Canceled'
    | 'Network Keys Configured'
    | 'Sponsee Detached'
    | 'Escaped Sponsor'
    | 'Migrating to Layer 2'
    | 'Sponsorship Rejected'
    | 'Management Proxy Changed'
    | 'Spawn Proxy Changed'
    | 'Transfer Proxy Changed'
    | 'Voting Proxy Changed'
    | 'Ship Spawned'
    | 'Ship Transferred';
} = {
  adopt: 'Ship Sponsored',
  'cancel-escape': 'Escape Canceled',
  'cancel-transfer': 'Transfer Canceled',
  'configure-keys': 'Network Keys Configured',
  detach: 'Sponsee Detached',
  escape: 'Escaped Sponsor',
  migrate: 'Migrating to Layer 2',
  reject: 'Sponsorship Rejected',
  'set-management-proxy': 'Management Proxy Changed',
  'set-spawn-proxy': 'Spawn Proxy Changed',
  'set-transfer-proxy': 'Transfer Proxy Changed',
  'set-voting-proxy': 'Voting Proxy Changed',
  spawn: 'Ship Spawned',
  'transfer-point': 'Ship Transferred',
};
const DUMMY_L2_ADDRESS = '0x1111111111111111111111111111111111111111';

const ONE_SECOND = 1000;
const TWO_SECONDS = 2 * ONE_SECOND;
const TEN_SECONDS = 10 * ONE_SECOND;
const ONE_MINUTE = 60 * ONE_SECOND;

const MASTER_TICKET_TOOLTIP =
  'Your Master Ticket is your 4-word password for your Urbit';

const PASSPORT_TOOLTIP =
  'Your Passport contains all of the address information for your wallet';

const LOCKUP_TOOLTIP =
  'Stars in a lockup schedule can be withdrawn after a set time duration. The duration is predetermined by the issuer';

export {
  CHECK_BLOCK_EVERY_MS,
  DEFAULT_GAS_PRICE_GWEI,
  DEFAULT_HD_PATH,
  ETH_ZERO_ADDR,
  ETH_ZERO_ADDR_SHORT,
  LINEAR_STAR_RELEASE,
  CONDITIONAL_STAR_RELEASE,
  MAX_GAS_PRICE_GWEI,
  GAS_LIMITS,
  GEN_STATES,
  BUTTON_STATES,
  PROFILE_STATES,
  MIN_GALAXY,
  MAX_GALAXY,
  MIN_STAR,
  MAX_STAR,
  MIN_PLANET,
  MAX_PLANET,
  NONCUSTODIAL_WALLETS,
  PLANET_ENTROPY_BITS,
  STAR_ENTROPY_BITS,
  GALAXY_ENTROPY_BITS,
  SEED_ENTROPY_BITS,
  WALLET_TYPES,
  ZOD,
  PROGRESS_ANIMATION_DELAY_MS,
  ROLLER_HOSTS,
  POINT_DOMINIONS,
  POINT_PROXIES,
  DEFAULT_FADE_TIMEOUT,
  MASTER_KEY_DURATION,
  INVITES_PER_PAGE,
  DEFAULT_NUM_INVITES,
  DEFAULT_CSV_NAME,
  TRANSACTION_STATUS_ICONS,
  TRANSACTION_TYPE_ICONS,
  TRANSACTION_TYPE_TITLES,
  DUMMY_L2_ADDRESS,
  ONE_SECOND,
  TWO_SECONDS,
  TEN_SECONDS,
  ONE_MINUTE,
  MASTER_TICKET_TOOLTIP,
  PASSPORT_TOOLTIP,
  LOCKUP_TOOLTIP,
};
