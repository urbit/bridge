import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import Bridge from './Bridge';

const render = () =>
  ReactDOM.render(
    <AppContainer>
      <Bridge />
    </AppContainer>,
    document.getElementById('root')
  );

// Render once
render();

// Webpack Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./Bridge', () => {
    render();
  });
}
