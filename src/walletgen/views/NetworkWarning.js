import React from 'react';

const NetworkWarning = props => (
  <div className={'col-md-6'}>
    <h2>{'You may not use this tool while connected to a network.'}</h2>

    <p>
      To continue, disconnect from the internet and refresh the page. If you
      highly value your ships, we recommend you use a new, airgapped machine.
    </p>
  </div>
);

export default NetworkWarning;
