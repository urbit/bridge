import 'babel-polyfill'; // required for @ledgerhq/hw-transport-u2f

import React from 'react';
import ReactDOM from 'react-dom';

import { Root } from './Root';

ReactDOM.render(<Root />, document.getElementById('root'));
