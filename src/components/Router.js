import React from 'react';

import { useHistory } from 'store/history';

export default function Router() {
  const { Route } = useHistory();

  return <Route />;
}
