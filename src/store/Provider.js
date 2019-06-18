import nest from 'lib/nest';

import { HistoryProvider } from './history';
import { TxnConfirmationsProvider } from './txnConfirmations';
import { OnlineProvider } from './online';
import { NetworkProvider } from './network';
import { WalletProvider } from './wallet';
import { PointCursorProvider } from './pointCursor';
import { PointCacheProvider } from './pointCache';
import { TxnCursorProvider } from './txnCursor';

// nest all of the providers within each other to avoid hella depth
export default nest([
  HistoryProvider,
  TxnConfirmationsProvider,
  OnlineProvider,
  NetworkProvider,
  WalletProvider,
  PointCursorProvider,
  PointCacheProvider,
  TxnCursorProvider,
]);
