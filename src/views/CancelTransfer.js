import React from 'react';

import View from 'components/View';

import AdminCancelTransfer from './Admin/AdminCancelTransfer';
import { useLocalRouter } from 'lib/LocalRouter';

export default function CancelTransfer() {
  const { pop } = useLocalRouter();

  return (
    <View pop={pop} inset>
      <AdminCancelTransfer />
    </View>
  );
}
