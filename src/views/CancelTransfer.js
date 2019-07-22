import React from 'react';

import View from 'components/View';

import AdminCancelTransfer from './Admin/AdminCancelTransfer';
import { LocalRouterProvider } from 'lib/LocalRouter';
import { useHistory } from 'store/history';

export default function CancelTransfer() {
  const history = useHistory();

  return (
    // TODO: this is a hack so AdminCancelTransfer works unmodified
    // TODO: consolidate history & 'local' router providers
    <LocalRouterProvider value={history}>
      <View inset>
        <AdminCancelTransfer />
      </View>
    </LocalRouterProvider>
  );
}
