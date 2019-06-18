import React from 'react';

import { useHistory } from 'store/history';
import router from 'lib/router';

// router is just a component that renders a specific view
// depending on the lastest route in the history
export default function Router() {
  const history = useHistory();
  const Route = router(history.peek());

  return <Route />;
}
