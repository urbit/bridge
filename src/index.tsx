import { Buffer } from 'buffer';
import ReactDOM from 'react-dom';
import Bridge from './Bridge';

(window as any).Buffer = Buffer;

ReactDOM.render(<Bridge />, document.getElementById('root'));
