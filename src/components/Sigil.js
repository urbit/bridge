import { pour } from 'sigil-js';

import ReactSVGComponents from './ReactSVGComponents';

export default function Sigil({ patp, size, colorway, ...rest }) {
  return pour({
    renderer: ReactSVGComponents,
    patp,
    size,
    colorway,
    ...rest,
  });
}
