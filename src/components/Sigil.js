import { pour } from 'sigil-js';

import ReactSVGComponents from './ReactSVGComponents';

export default function Sigil({ patp, size, colorway, ...rest }) {
  try {
    // https://github.com/urbit/sigil-js/issues/31
    return pour({
      renderer: ReactSVGComponents,
      patp,
      size,
      colorway,
      ...rest,
    });
  } catch {
    return null;
  }
}
