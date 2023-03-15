import {Buffer} from "buffer";
window.Buffer = Buffer;

import ReactDOM from 'react-dom';
import Bridge from './Bridge';


ReactDOM.render(<Bridge />, document.getElementById('root'));
